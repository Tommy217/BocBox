package com.bocbox.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

/** "Mẫu của tôi": thiết kế áo khách lưu lại để lần sau dùng tiếp (chỉ phần áo, không có tag, thiệp, giao hàng). */
@Document(collection = "saved_designs")
public class SavedDesign implements SequencedEntity {
    @Id
    private Long id;
    private Long customerId;
    private String name;
    private String memeSlug;     // lớp đầu tiên, null nếu áo chỉ có chữ
    private String colorHex;
    private String textLine1;
    private String textLine2;
    private String font;
    private String layoutJson;   // cùng dạng với đơn hàng: {"layers":[{slug,x,y,w}],"text":{x,y,s}}
    private LocalDateTime createdAt;

    @Override public Long getId() { return id; }
    @Override public void setId(Long id) { this.id = id; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getMemeSlug() { return memeSlug; }
    public void setMemeSlug(String memeSlug) { this.memeSlug = memeSlug; }
    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }
    public String getTextLine1() { return textLine1; }
    public void setTextLine1(String textLine1) { this.textLine1 = textLine1; }
    public String getTextLine2() { return textLine2; }
    public void setTextLine2(String textLine2) { this.textLine2 = textLine2; }
    public String getFont() { return font; }
    public void setFont(String font) { this.font = font; }
    public String getLayoutJson() { return layoutJson; }
    public void setLayoutJson(String layoutJson) { this.layoutJson = layoutJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
