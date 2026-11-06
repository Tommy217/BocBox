package com.bocbox.entity;

/**
 * Document dùng id số (Long) như bản SQL cũ để frontend không phải đổi.
 * Id mới được cấp tự động từ collection "counters" (xem config/IdSequenceCallback) trước khi lưu.
 */
public interface SequencedEntity {
    Long getId();
    void setId(Long id);
}
