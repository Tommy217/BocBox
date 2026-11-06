package com.bocbox.entity;

import jakarta.persistence.*;
import com.bocbox.entity.enums.ContentStatus;
import com.bocbox.entity.enums.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Đơn hàng: 1 box = 1 áo tự thiết kế + 1 khô gấu random. Thiết kế lưu dạng cấu hình để render lại file in. Luồng trạng thái: {@link OrderStatus}. */
@Entity
@Table(name = "orders")
public class CustomerOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 20)
    private String code;
    private LocalDateTime createdAt;
    @Enumerated(EnumType.STRING) @Column(length = 30)
    private OrderStatus status = OrderStatus.PENDING_APPROVAL;
    @Enumerated(EnumType.STRING) @Column(length = 20)
    private ContentStatus contentStatus = ContentStatus.PENDING_REVIEW;
    @Column(precision = 12, scale = 0)
    private BigDecimal price;
    // người tặng / người nhận / form ngụy trang đã dùng
    @Column(length = 100)
    private String giverName;
    @Column(length = 100)
    private String recipientName;
    private Long spyTemplateId;
    // thiết kế áo; memeSlug = lớp đầu tiên (slug meme hoặc u:{uuid}), null = áo chỉ có chữ
    @Column(length = 50)
    private String memeSlug;
    @Column(length = 50)
    private String colorName;
    @Column(length = 7)
    private String colorHex;
    @Column(length = 5)
    private String sizeCode;
    @Column(length = 40)
    private String textLine1;
    @Column(length = 40)
    private String textLine2;
    @Column(length = 40)
    private String font;
    @Column(name = "print_position", length = 10)
    private String position;
    /** Bố cục tự do: {"layers":[{slug,x,y,w}],"text":{x,y,s}}, tọa độ theo tỉ lệ vùng in A4. Null = đơn cũ. */
    @Column(length = 2000)
    private String layoutJson;
    // thiệp kèm hộp: SPY / MEME / PLAIN + lời nhắn
    @Column(length = 10)
    private String cardStyle;
    @Column(length = 400)
    private String cardMessage;
    // giao hàng
    @Column(length = 100)
    private String shippingName;
    @Column(length = 20)
    private String shippingPhone;
    @Column(length = 300)
    private String shippingAddress;
    @Column(length = 120)
    private String email;
    @ManyToOne(fetch = FetchType.EAGER)
    private Batch batch;
    /** Tài khoản khách đặt đơn (null với đơn tạo trước khi có tài khoản khách). */
    @ManyToOne(fetch = FetchType.EAGER)
    private Customer customer;
    @Column(length = 100)
    private String keychainDesign;
    @Column(length = 30)
    private String carrier;
    @Column(length = 50)
    private String trackingCode;
    @Column(length = 300)
    private String reviewNote;

    /** Đơn thuộc tài khoản khách này. */
    public boolean belongsTo(Customer c) { return customer != null && c != null && customer.getId().equals(c.getId()); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public ContentStatus getContentStatus() { return contentStatus; }
    public void setContentStatus(ContentStatus contentStatus) { this.contentStatus = contentStatus; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
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
    public Batch getBatch() { return batch; }
    public void setBatch(Batch batch) { this.batch = batch; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public String getKeychainDesign() { return keychainDesign; }
    public void setKeychainDesign(String keychainDesign) { this.keychainDesign = keychainDesign; }
    public String getCarrier() { return carrier; }
    public void setCarrier(String carrier) { this.carrier = carrier; }
    public String getTrackingCode() { return trackingCode; }
    public void setTrackingCode(String trackingCode) { this.trackingCode = trackingCode; }
    public String getReviewNote() { return reviewNote; }
    public void setReviewNote(String reviewNote) { this.reviewNote = reviewNote; }
}
