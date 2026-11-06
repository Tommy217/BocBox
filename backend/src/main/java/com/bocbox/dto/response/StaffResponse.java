package com.bocbox.dto.response;

import java.time.LocalDateTime;

/** Một dòng trong trang quản lý nhân viên. */
public record StaffResponse(Long id, String username, String displayName, String role, boolean active,
                            LocalDateTime createdAt, LocalDateTime lastLoginAt) {}
