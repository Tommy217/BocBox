package com.bocbox.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.bocbox.entity.enums.ContentStatus;
import com.bocbox.entity.enums.OrderStatus;
import java.time.LocalDateTime;

/**
 * Đơn hàng: 1 box = 1 áo tự thiết kế + 1 khô gấu random. Thiết kế lưu dạng cấu hình để render lại file in.
 * Liên kết tới đợt và tài khoản khách bằng id (batchId, customerId). Luồng trạng thái: {@link OrderStatus}.
 */
@Document(collection = "orders")
public class CustomerOrder implements SequencedEntity {
    @Id
    private Long id;
    // mã đơn BB + yyMMdd + 4 ký tự, duy nhất
    private String code;
    private LocalDateTime createdAt;
    private OrderStatus status = OrderStatus.PENDING_APPROVAL;
    private ContentStatus contentStatus = ContentStatus.PENDING_REVIEW;
    /** Giá (đồng). */
    private long price;
    // người tặng / người nhận / form ngụy trang đã dùng
    private String giverName;
    private String recipientName;
    private Long spyTemplateId;
    // thiết kế áo; memeSlug = lớp đầu tiên (slug meme hoặc u:{uuid}), null = áo chỉ có chữ
    private String memeSlug;
    private String colorName;
    private String colorHex;
    private String sizeCode;
    private String textLine1;
    private String textLine2;
    private String font;
    /** CHEST | CENTER */
    private String position;
    /** Bố cục tự do: {"layers":[{slug,x,y,w}],"text":{x,y,s}}, tọa độ theo tỉ lệ vùng in A3. */
    private String layoutJson;
    // thiệp kèm hộp: SPY / MEME / PLAIN + lời nhắn
    private String cardStyle;
    private String cardMessage;
    // giao hàng
    private String shippingName;
    private String shippingPhone;
    private String shippingAddress;
    private String email;
    /** Đợt pre-order chứa đơn. */
    private Long batchId;
    /** Tài khoản khách đặt đơn (null với đơn tạo trước khi có tài khoản khách). */
    private Long customerId;
    private String keychainDesign;
    private String carrier;
    private String trackingCode;
    private String reviewNote;

    /** Đơn thuộc tài khoản khách này. */
    public boolean belongsTo(Customer c) { return customerId != null && c != null && customerId.equals(c.getId()); }

    @Override public Long getId() { return id; }
    @Override public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public ContentStatus getContentStatus() { return contentStatus; }
    public void setContentStatus(ContentStatus contentStatus) { this.contentStatus = contentStatus; }
    public long getPrice() { return price; }
    public void setPrice(long price) { this.price = price; }
    public String getGiverName() { return giverName; }
    public void setGiverName(String giverName) { this.giverName = giverName; }
    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }
    public Long getSpyTemplateId() { return spyTemplateId; }
    public void setSpyTemplateId(Long spyTemplateId) { this.spyTemplateId = spyTemplateId; }
    public String getMemeSlug() { return memeSlug; }
    public void setMemeSlug(String memeSlug) { this.memeSlug = memeSlug; }
    public String getColorName() { return colorName; }
    public void setColorName(String colorName) { this.colorName = colorName; }
    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }
    public String getSizeCode() { return sizeCode; }
    public void setSizeCode(String sizeCode) { this.sizeCode = sizeCode; }
    public String getTextLine1() { return textLine1; }
    public void setTextLine1(String textLine1) { this.textLine1 = textLine1; }
    public String getTextLine2() { return textLine2; }
    public void setTextLine2(String textLine2) { this.textLine2 = textLine2; }
    public String getFont() { return font; }
    public void setFont(String font) { this.font = font; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public String getLayoutJson() { return layoutJson; }
    public void setLayoutJson(String layoutJson) { this.layoutJson = layoutJson; }
    public String getCardStyle() { return cardStyle; }
    public void setCardStyle(String cardStyle) { this.cardStyle = cardStyle; }
    public String getCardMessage() { return cardMessage; }
    public void setCardMessage(String cardMessage) { this.cardMessage = cardMessage; }
    public String getShippingName() { return shippingName; }
    public void setShippingName(String shippingName) { this.shippingName = shippingName; }
    public String getShippingPhone() { return shippingPhone; }
    public void setShippingPhone(String shippingPhone) { this.shippingPhone = shippingPhone; }
    public String getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Long getBatchId() { return batchId; }
    public void setBatchId(Long batchId) { this.batchId = batchId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getKeychainDesign() { return keychainDesign; }
    public void setKeychainDesign(String keychainDesign) { this.keychainDesign = keychainDesign; }
    public String getCarrier() { return carrier; }
    public void setCarrier(String carrier) { this.carrier = carrier; }
    public String getTrackingCode() { return trackingCode; }
    public void setTrackingCode(String trackingCode) { this.trackingCode = trackingCode; }
    public String getReviewNote() { return reviewNote; }
    public void setReviewNote(String reviewNote) { this.reviewNote = reviewNote; }
}
