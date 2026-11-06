package com.bocbox.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Ảnh khách tự tải lên để in áo. Trên áo, lớp ảnh có slug "u:{uuid}" ({@link #SLUG_PREFIX}); meme có sẵn dùng slug thường.
 * Lưu thẳng trong DB (varbinary) để chạy lại sql/bocbox-full.sql là sạch cả ảnh. Ảnh đi qua hàng chờ duyệt cùng đơn.
 */
@Entity
@Table(name = "custom_images")
public class CustomImage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 36)
    private String uuid;
    @Column(nullable = false)
    private Long customerId;
    @Column(nullable = false, length = 30)
    private String contentType;
    private int sizeBytes;
    @Column(nullable = false)
    private byte[] data;
    private LocalDateTime createdAt;

    /** Tiền tố slug của lớp ảnh khách tải lên (phân biệt với slug meme). */
    public static final String SLUG_PREFIX = "u:";

    public static boolean isUploadSlug(String slug) { return slug != null && slug.startsWith(SLUG_PREFIX); }
    public String slug() { return SLUG_PREFIX + uuid; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
