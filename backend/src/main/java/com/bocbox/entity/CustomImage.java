package com.bocbox.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

/**
 * Ảnh khách tự tải lên để in áo. Trên áo, lớp ảnh có slug "u:{uuid}" ({@link #SLUG_PREFIX}); meme có sẵn dùng slug thường.
 * Lưu thẳng trong MongoDB (kiểu Binary, ≤ 3 MB) nên deploy lại server không mất ảnh. Ảnh đi qua hàng chờ duyệt cùng đơn.
 */
@Document(collection = "custom_images")
public class CustomImage implements SequencedEntity {
    @Id
    private Long id;
    private String uuid;
    private Long customerId;
    private String contentType;
    private int sizeBytes;
    private byte[] data;
    private LocalDateTime createdAt;

    /** Tiền tố slug của lớp ảnh khách tải lên (phân biệt với slug meme). */
    public static final String SLUG_PREFIX = "u:";

    public static boolean isUploadSlug(String slug) { return slug != null && slug.startsWith(SLUG_PREFIX); }
    public String slug() { return SLUG_PREFIX + uuid; }

    @Override public Long getId() { return id; }
    @Override public void setId(Long id) { this.id = id; }
    public String getUuid() { return uuid; }
    public void setUuid(String uuid) { this.uuid = uuid; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public int getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(int sizeBytes) { this.sizeBytes = sizeBytes; }
    public byte[] getData() { return data; }
    public void setData(byte[] data) { this.data = data; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
