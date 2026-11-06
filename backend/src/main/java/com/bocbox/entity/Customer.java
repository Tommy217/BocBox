package com.bocbox.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

/** Tài khoản khách: đăng nhập bằng số điện thoại (duy nhất) + mật khẩu BCrypt. Khách vãng lai không cần tài khoản cho tới lúc đặt đơn. */
@Document(collection = "customers")
public class Customer implements SequencedEntity {
    @Id
    private Long id;
    private String phone;
    private String passwordHash;
    private String fullName;
    private String email;
    private boolean active = true;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    @Override public Long getId() { return id; }
    @Override public void setId(Long id) { this.id = id; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
}
