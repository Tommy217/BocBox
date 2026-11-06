package com.bocbox.entity;

import jakarta.persistence.*;
import com.bocbox.entity.enums.StaffRole;
import java.time.LocalDateTime;

/** Tài khoản nhân viên vào trang quản trị. */
@Entity
@Table(name = "staff_users")
public class StaffUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 50)
    private String username;
    /** BCrypt. */
    @Column(nullable = false, length = 100)
    private String passwordHash;
    @Column(length = 100)
    private String displayName;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10)
    private StaffRole role = StaffRole.STAFF;
    private boolean active = true;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
