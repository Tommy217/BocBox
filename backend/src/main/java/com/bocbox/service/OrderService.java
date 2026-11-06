package com.bocbox.service;

import com.bocbox.config.BocboxProperties;
import com.bocbox.dto.OrderLayout;
import com.bocbox.dto.OrderLayout.Layer;
import com.bocbox.dto.request.CreateOrderRequest;
import com.bocbox.entity.*;
import com.bocbox.entity.enums.ContentStatus;
import com.bocbox.entity.enums.MemeStatus;
import com.bocbox.entity.enums.OrderStatus;
import com.bocbox.exception.AppException;
import com.bocbox.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Stream;

/** Nghiệp vụ đơn hàng: khách đặt / sửa / hủy, quản trị duyệt, chuyển trạng thái, bốc khô gấu. */
@Service
public class OrderService {
    /** Bỏ 0/O, 1/I/L cho dễ đọc khi khách nhập tay. */
    private static final String CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final int MAX_LAYERS = 4;

    private final CustomerOrderRepository orders;
    private final BatchService batchService;
    private final ContentFilter filter;
    private final KeychainDesignRepository keychains;
    private final ShirtColorRepository colors;
    private final MemeRepository memes;
    private final SpyFormTemplateRepository spyForms;
    private final CustomImageRepository images;
    private final ObjectMapper mapper;
    private final BigDecimal price;
    private final Random random = new Random();
    private final SecureRandom codeRandom = new SecureRandom();

    public OrderService(CustomerOrderRepository orders, BatchService batchService, ContentFilter filter,
                        KeychainDesignRepository keychains, ShirtColorRepository colors, MemeRepository memes,
                        SpyFormTemplateRepository spyForms, CustomImageRepository images, ObjectMapper mapper,
                        BocboxProperties props) {
        this.orders = orders; this.batchService = batchService; this.filter = filter;
        this.keychains = keychains; this.colors = colors; this.memes = memes; this.spyForms = spyForms; this.images = images;
        this.mapper = mapper; this.price = BigDecimal.valueOf(props.price());
    }

    // ---------- Khách ----------

    /** Khách đã đăng nhập đặt đơn: đơn vào hàng chờ duyệt, chưa cần trả tiền. */
    @Transactional
    public CustomerOrder create(Customer customer, CreateOrderRequest r) {
        CustomerOrder o = new CustomerOrder();
        o.setCode(nextCode());
        o.setCreatedAt(LocalDateTime.now(BatchService.VN));
        o.setPrice(price);
        o.setBatch(batchService.currentOpenBatch());
        o.setCustomer(customer);
        o.setStatus(OrderStatus.PENDING_APPROVAL);
        apply(o, r);
        return orders.save(o);
    }

    /** Khách sửa thiết kế (thường sau khi bị báo "Cần sửa"): đơn quay lại hàng chờ duyệt. */
    @Transactional
    public CustomerOrder update(String code, Customer customer, CreateOrderRequest r) {
        CustomerOrder o = getForCustomer(code, customer);
        if (o.getStatus() != OrderStatus.PENDING_APPROVAL && o.getStatus() != OrderStatus.PENDING_PAYMENT)
            throw AppException.conflict("Đơn đã thanh toán hoặc đã vào sản xuất, không sửa được nữa");
        requireOpenBatch(o);
        apply(o, r);
        o.setStatus(OrderStatus.PENDING_APPROVAL);
        o.setReviewNote(null);
        return orders.save(o);
    }

    @Transactional
    public CustomerOrder cancel(String code, Customer customer) {
        CustomerOrder o = getForCustomer(code, customer);
        if (o.getStatus() != OrderStatus.PENDING_APPROVAL && o.getStatus() != OrderStatus.PENDING_PAYMENT && o.getStatus() != OrderStatus.PAID)
            throw AppException.conflict("Đơn đã vào sản xuất, không hủy được");
        requireOpenBatch(o);
        o.setStatus(OrderStatus.CANCELLED);
        return orders.save(o);
    }

    @Transactional(readOnly = true)
    public List<CustomerOrder> listForCustomer(Customer customer) {
        return orders.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
    }

    /** Khách chỉ xem được đơn của chính tài khoản mình; đơn của người khác báo như không tồn tại. */
    @Transactional(readOnly = true)
    public CustomerOrder getForCustomer(String code, Customer customer) {
        return orders.findByCode(code.toUpperCase()).filter(o -> o.belongsTo(customer))
                .orElseThrow(() -> AppException.notFound("Không tìm thấy đơn " + code + " trong tài khoản của bạn"));
    }

    // ---------- Quản trị ----------

    @Transactional(readOnly = true)
    public CustomerOrder get(String code) {
        return orders.findByCode(code.toUpperCase()).orElseThrow(() -> AppException.notFound("Không tìm thấy đơn " + code));
    }

    /** Lọc đơn theo đợt, trạng thái và từ khóa (mã đơn, tên người tặng/nhận/nhận hàng, SĐT, tài khoản đặt). */
    @Transactional(readOnly = true)
    public List<CustomerOrder> search(Long batchId, String status, String q) {
        List<CustomerOrder> list = batchId == null ? orders.findAllByOrderByCreatedAtDesc() : orders.findByBatchIdOrderByCreatedAtAsc(batchId);
        String key = q == null ? "" : q.trim().toLowerCase();
        return list.stream()
                .filter(o -> status == null || status.isBlank() || o.getStatus().name().equals(status))
                .filter(o -> key.isEmpty() || Stream.of(o.getCode(), o.getGiverName(), o.getRecipientName(), o.getShippingName(), o.getShippingPhone(),
                                o.getCustomer() == null ? null : o.getCustomer().getPhone(), o.getCustomer() == null ? null : o.getCustomer().getFullName())
                        .anyMatch(s -> s != null && s.toLowerCase().contains(key)))
                .toList();
    }

    @Transactional
    public CustomerOrder confirmPayment(String code) {
        CustomerOrder o = get(code);
        if (o.getStatus() != OrderStatus.PENDING_PAYMENT)
            throw AppException.conflict("Đơn không ở trạng thái chờ thanh toán");
        o.setStatus(OrderStatus.PAID);
        return orders.save(o);
    }

    /**
     * Duyệt đơn: đạt → nội dung APPROVED, đơn đang chờ duyệt chuyển sang chờ thanh toán (khách thấy mã VietQR).
     * Cần sửa → NEEDS_EDIT kèm ghi chú cho khách; đơn chưa trả tiền quay về chờ duyệt để khách sửa.
     */
    @Transactional
    public CustomerOrder review(String code, boolean approve, String note) {
        CustomerOrder o = get(code);
        OrderStatus s = o.getStatus();
        if (s != OrderStatus.PENDING_APPROVAL && s != OrderStatus.PENDING_PAYMENT && s != OrderStatus.PAID && s != OrderStatus.REPRINT)
            throw AppException.conflict("Đơn đã vào sản xuất, không duyệt lại được");
        if (!approve && (note == null || note.isBlank()))
            throw AppException.invalid("Ghi lý do cần sửa để khách biết");
        o.setContentStatus(approve ? ContentStatus.APPROVED : ContentStatus.NEEDS_EDIT);
        o.setReviewNote(approve ? null : note.trim());
        if (approve && s == OrderStatus.PENDING_APPROVAL) o.setStatus(OrderStatus.PENDING_PAYMENT);
        if (!approve && s == OrderStatus.PENDING_PAYMENT) o.setStatus(OrderStatus.PENDING_APPROVAL);
        return orders.save(o);
    }

    @Transactional
    public CustomerOrder setStatus(String code, OrderStatus status, String carrier, String tracking, String note) {
        CustomerOrder o = get(code);
        if (!o.getStatus().next().contains(status))
            throw AppException.conflict("Không chuyển được từ " + o.getStatus() + " sang " + status);
        if ((status == OrderStatus.PRINTING || status == OrderStatus.PENDING_PAYMENT) && o.getContentStatus() != ContentStatus.APPROVED)
            throw AppException.conflict("Thiết kế chưa được duyệt");
        o.setStatus(status);
        if (note != null && !note.isBlank()) o.setReviewNote(note.trim()); // vd. lý do từ chối đơn
        if (carrier != null) o.setCarrier(carrier);
        if (tracking != null) o.setTrackingCode(tracking);
        return orders.save(o);
    }

    /** Bốc ngẫu nhiên khô gấu cho mọi đơn đã thanh toán của đợt, xác suất theo tồn kho còn lại. */
    @Transactional
    public List<CustomerOrder> assignKeychains(Long batchId) {
        List<CustomerOrder> result = new ArrayList<>();
        for (CustomerOrder o : orders.findByBatchIdOrderByCreatedAtAsc(batchId)) {
            if (o.getKeychainDesign() != null || !o.getStatus().isPaid()) continue;
            List<KeychainDesign> pool = keychains.findAll().stream().filter(k -> k.getStockQty() > 0).toList();
            if (pool.isEmpty()) throw AppException.conflict("Hết tồn kho móc khóa");
            int pick = random.nextInt(pool.stream().mapToInt(KeychainDesign::getStockQty).sum());
            KeychainDesign chosen = pool.get(0);
            for (KeychainDesign k : pool) { pick -= k.getStockQty(); if (pick < 0) { chosen = k; break; } }
            chosen.setStockQty(chosen.getStockQty() - 1);
            keychains.save(chosen);
            o.setKeychainDesign(chosen.getName());
            result.add(orders.save(o));
        }
        return result;
    }

    // ---------- Kiểm tra & ghi thiết kế ----------

    private void requireOpenBatch(CustomerOrder o) {
        if (!BatchService.isOpen(o.getBatch())) throw AppException.conflict("Đợt đã chốt, không sửa/hủy đơn được nữa");
    }

    private Meme approvedMeme(String slug) {
        return memes.findBySlug(slug).filter(m -> m.getStatus() == MemeStatus.APPROVED)
                .orElseThrow(() -> AppException.invalid("Meme không hợp lệ"));
    }

    /** Lớp ảnh khách tải lên ("u:{uuid}") phải thuộc chính tài khoản đặt đơn; lớp còn lại phải là meme đang bán. */
    private void checkLayerImage(String slug, Customer owner) {
        if (CustomImage.isUploadSlug(slug)) {
            boolean ok = images.findByUuid(slug.substring(CustomImage.SLUG_PREFIX.length()))
                    .filter(i -> owner != null && i.getCustomerId().equals(owner.getId())).isPresent();
            if (!ok) throw AppException.invalid("Ảnh tải lên không hợp lệ, hãy tải lại ảnh");
        } else approvedMeme(slug);
    }

    /** Kiểm tra bố cục tự do (0–4 lớp meme/ảnh, tọa độ trong vùng in) và ghi lại dạng chuẩn; trả về slug lớp đầu tiên (null nếu áo chỉ có chữ). */
    private String applyLayout(CustomerOrder o, String json) {
        if (json == null || json.isBlank()) { o.setLayoutJson(null); return null; }
        OrderLayout l;
        try { l = mapper.readValue(json, OrderLayout.class); }
        catch (Exception e) { throw AppException.invalid("Bố cục áo không hợp lệ"); }
        List<Layer> layers = l.layers() == null ? List.of() : l.layers();
        if (layers.size() > MAX_LAYERS) throw AppException.invalid("Áo tối đa " + MAX_LAYERS + " meme/ảnh");
        for (Layer x : layers) {
            checkLayerImage(x.slug(), o.getCustomer());
            if (!in01(x.x()) || !in01(x.y()) || x.w() <= 0 || x.w() > 1) throw AppException.invalid("Meme nằm ngoài vùng in");
        }
        if (l.text() != null && (!in01(l.text().x()) || !in01(l.text().y()) || l.text().s() <= 0 || l.text().s() > 0.2))
            throw AppException.invalid("Chữ nằm ngoài vùng in");
        try { o.setLayoutJson(mapper.writeValueAsString(new OrderLayout(layers, l.text()))); }
        catch (Exception e) { throw new IllegalStateException(e); }
        return layers.isEmpty() ? null : layers.get(0).slug();
    }

    private static boolean in01(double v) { return v >= 0 && v <= 1; }

    private void apply(CustomerOrder o, CreateOrderRequest r) {
        String first = applyLayout(o, r.layoutJson());
        if (o.getLayoutJson() == null && r.memeSlug() != null && !r.memeSlug().isBlank()) { // client cũ: chỉ gửi memeSlug
            approvedMeme(r.memeSlug()); first = r.memeSlug();
        }
        if (r.spyTemplateId() != null && !spyForms.existsById(r.spyTemplateId()))
            throw AppException.invalid("Kịch bản form ngụy trang không hợp lệ");
        o.setGiverName(r.giverName().trim());
        o.setRecipientName(r.recipientName().trim());
        o.setSpyTemplateId(r.spyTemplateId());
        o.setMemeSlug(first);
        ShirtColor c = colors.findAll().stream().filter(x -> x.isActive() && x.getHex().equalsIgnoreCase(r.colorHex())).findFirst()
                .orElseThrow(() -> AppException.invalid("Màu áo không hợp lệ"));
        o.setColorHex(c.getHex()); o.setColorName(c.getName());
        o.setSizeCode(r.sizeCode());
        o.setTextLine1(blankToNull(r.textLine1()));
        o.setTextLine2(blankToNull(r.textLine2()));
        if (first == null && o.getTextLine1() == null && o.getTextLine2() == null)
            throw AppException.invalid("Áo đang trống: thêm ít nhất một meme, ảnh hoặc dòng chữ");
        o.setFont(r.font());
        o.setPosition(r.position() == null ? "CENTER" : r.position());
        o.setShippingName(r.shippingName()); o.setShippingPhone(r.shippingPhone());
        o.setShippingAddress(r.shippingAddress()); o.setEmail(blankToNull(r.email()));
        // thiệp: mặc định thiệp điệp viên nếu có dùng form ngụy trang, không thì thiệp meme
        o.setCardStyle(r.cardStyle() != null ? r.cardStyle() : (o.getSpyTemplateId() != null ? "SPY" : "MEME"));
        o.setCardMessage(blankToNull(r.cardMessage()));
        // mọi đơn đều qua quản trị duyệt (thiết kế, ảnh tải lên, chữ, lời nhắn); từ nghi vi phạm thì gắn cờ để xem kỹ
        o.setContentStatus(filter.isSuspicious(o.getTextLine1(), o.getTextLine2(), o.getGiverName(), o.getRecipientName(), o.getCardMessage())
                ? ContentStatus.FLAGGED : ContentStatus.PENDING_REVIEW);
    }

    /** Mã đơn BB + yyMMdd + 4 ký tự ngẫu nhiên: không đoán được mã đơn khác, hai đơn cùng lúc không bị trùng. */
    private String nextCode() {
        String prefix = "BB" + LocalDate.now(BatchService.VN).format(DateTimeFormatter.ofPattern("yyMMdd"));
        while (true) {
            StringBuilder sb = new StringBuilder(prefix);
            for (int i = 0; i < 4; i++) sb.append(CODE_CHARS.charAt(codeRandom.nextInt(CODE_CHARS.length())));
            if (!orders.existsByCode(sb.toString())) return sb.toString();
        }
    }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }
}
