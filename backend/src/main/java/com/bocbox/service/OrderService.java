package com.bocbox.service;

import com.bocbox.dto.OrderLayout.Layer;
import com.bocbox.dto.request.CreateOrderRequest;
import com.bocbox.entity.*;
import com.bocbox.entity.enums.ContentStatus;
import com.bocbox.entity.enums.OrderStatus;
import com.bocbox.exception.AppException;
import com.bocbox.repository.*;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/** Nghiệp vụ đơn hàng: khách đặt / sửa / hủy, quản trị duyệt, chuyển trạng thái, bốc khô gấu. */
@Service
public class OrderService {
    /** Bỏ 0/O, 1/I/L cho dễ đọc khi khách nhập tay. */
    private static final String CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

    private final CustomerOrderRepository orders;
    private final BatchService batchService;
    private final ContentFilter filter;
    private final KeychainDesignRepository keychains;
    private final ShirtColorRepository colors;
    private final SpyFormTemplateRepository spyForms;
    private final LayoutValidator layouts;
    private final PriceCalculator prices;
    private final CustomerRepository customers;
    private final BatchRepository batches;
    private final Random random = new Random();
    private final SecureRandom codeRandom = new SecureRandom();

    public OrderService(CustomerOrderRepository orders, BatchService batchService, ContentFilter filter,
                        KeychainDesignRepository keychains, ShirtColorRepository colors,
                        SpyFormTemplateRepository spyForms, LayoutValidator layouts,
                        CustomerRepository customers, BatchRepository batches, PriceCalculator prices) {
        this.orders = orders; this.batchService = batchService; this.filter = filter;
        this.keychains = keychains; this.colors = colors; this.spyForms = spyForms;
        this.layouts = layouts; this.prices = prices;
        this.customers = customers; this.batches = batches;
    }

    // ---------- Khách ----------

    /** Khách đã đăng nhập đặt đơn: đơn vào hàng chờ duyệt, chưa cần trả tiền. */
    public CustomerOrder create(Customer customer, CreateOrderRequest r) {
        CustomerOrder o = new CustomerOrder();
        o.setCode(nextCode());
        o.setCreatedAt(LocalDateTime.now(BatchService.VN));
        o.setBatchId(batchService.currentOpenBatch().getId());
        o.setCustomerId(customer.getId());
        o.setStatus(OrderStatus.PENDING_APPROVAL);
        apply(o, r);
        return orders.save(o);
    }

    /** Khách sửa thiết kế (thường sau khi bị báo "Cần sửa"): đơn quay lại hàng chờ duyệt. */
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

    public CustomerOrder cancel(String code, Customer customer) {
        CustomerOrder o = getForCustomer(code, customer);
        if (o.getStatus() != OrderStatus.PENDING_APPROVAL && o.getStatus() != OrderStatus.PENDING_PAYMENT && o.getStatus() != OrderStatus.PAID)
            throw AppException.conflict("Đơn đã vào sản xuất, không hủy được");
        requireOpenBatch(o);
        o.setStatus(OrderStatus.CANCELLED);
        return orders.save(o);
    }

    public List<CustomerOrder> listForCustomer(Customer customer) {
        return orders.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
    }

    /** Khách chỉ xem được đơn của chính tài khoản mình; đơn của người khác báo như không tồn tại. */
    public CustomerOrder getForCustomer(String code, Customer customer) {
        return orders.findByCode(code.toUpperCase()).filter(o -> o.belongsTo(customer))
                .orElseThrow(() -> AppException.notFound("Không tìm thấy đơn " + code + " trong tài khoản của bạn"));
    }

    // ---------- Quản trị ----------

    public CustomerOrder get(String code) {
        return orders.findByCode(code.toUpperCase()).orElseThrow(() -> AppException.notFound("Không tìm thấy đơn " + code));
    }

    /** Lọc đơn theo đợt, trạng thái và từ khóa (mã đơn, tên người tặng/nhận/nhận hàng, SĐT, tài khoản đặt). */
    public List<CustomerOrder> search(Long batchId, String status, String q) {
        List<CustomerOrder> list = batchId == null ? orders.findAllByOrderByCreatedAtDesc() : orders.findByBatchIdOrderByCreatedAtAsc(batchId);
        String key = q == null ? "" : q.trim().toLowerCase();
        // tìm cả theo SĐT / tên tài khoản đặt đơn
        Map<Long, Customer> owners = key.isEmpty() ? Map.of() : customers.findAllById(list.stream().map(CustomerOrder::getCustomerId)
                .filter(Objects::nonNull).distinct().toList()).stream().collect(Collectors.toMap(Customer::getId, c -> c));
        return list.stream()
                .filter(o -> status == null || status.isBlank() || o.getStatus().name().equals(status))
                .filter(o -> key.isEmpty() || Stream.of(o.getCode(), o.getGiverName(), o.getRecipientName(), o.getShippingName(), o.getShippingPhone(),
                                phoneOf(owners.get(o.getCustomerId())), nameOf(owners.get(o.getCustomerId())))
                        .anyMatch(s -> s != null && s.toLowerCase().contains(key)))
                .toList();
    }

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
        if (o.getBatchId() == null || !BatchService.isOpen(batches.findById(o.getBatchId()).orElse(null))) throw AppException.conflict("Đợt đã chốt, không sửa/hủy đơn được nữa");
    }

    /** Kiểm tra bố cục (xem LayoutValidator) và ghi lại dạng chuẩn; trả về các lớp (rỗng nếu áo chỉ có chữ). */
    private List<Layer> applyLayout(CustomerOrder o, String json) {
        LayoutValidator.Checked c = layouts.check(json, o.getCustomerId());
        o.setLayoutJson(c.json());
        return c.layers();
    }

    private void apply(CustomerOrder o, CreateOrderRequest r) {
        List<Layer> layers = applyLayout(o, r.layoutJson());
        String first = layers.isEmpty() ? null : layers.get(0).slug();
        int layerCount = layers.size();
        if (o.getLayoutJson() == null && r.memeSlug() != null && !r.memeSlug().isBlank()) { // client cũ: chỉ gửi memeSlug
            layouts.approvedMeme(r.memeSlug()); first = r.memeSlug(); layerCount = 1;
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
        // giá tính lại mỗi lần đặt / sửa, theo số meme trên áo và kiểu thiệp
        o.setPrice(prices.priceOf(layerCount, o.getCardStyle()));
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

    private static String phoneOf(Customer c) { return c == null ? null : c.getPhone(); }
    private static String nameOf(Customer c) { return c == null ? null : c.getFullName(); }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }
}
