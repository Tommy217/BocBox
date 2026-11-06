package com.bocbox.dto.response;

import java.time.Instant;

/** Nhân viên đang đăng nhập (kèm hạn phiên). */
public record StaffUserResponse(String username, String displayName, String role, Instant expiresAt) {}
