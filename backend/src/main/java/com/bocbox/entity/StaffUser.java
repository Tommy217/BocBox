package com.bocbox.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.bocbox.entity.enums.StaffRole;
import java.time.LocalDateTime;

/** Tài khoản nhân viên vào trang quản trị (username duy nhất, mật khẩu BCrypt). */
@Document(collection = "staff_users")
public class StaffUser implements SequencedEntity {
    @Id
    private Long id;
    private String username;
    private String passwordHash;
    private String displayName;
    private StaffRole role = StaffRole.STAFF;
    private boolean active = true;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    @Override public Long getId() { return id; }
    @Override public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public StaffRole getRole() { return role; }
    public void setRole(StaffRole role) { this.role = role; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
}
