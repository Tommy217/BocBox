package com.bocbox.mapper;

import com.bocbox.dto.response.CustomerResponse;
import com.bocbox.dto.response.StaffResponse;
import com.bocbox.entity.Customer;
import com.bocbox.entity.StaffUser;

import java.time.Instant;

/** Đổi tài khoản nhân viên / khách sang dữ liệu trả về API (không bao giờ trả passwordHash). */
public final class AccountMapper {
    private AccountMapper() {}

    public static StaffResponse toResponse(StaffUser u) {
        return new StaffResponse(u.getId(), u.getUsername(), u.getDisplayName(), u.getRole().name(), u.isActive(), u.getCreatedAt(), u.getLastLoginAt());
    }

    public static CustomerResponse toResponse(Customer c, Instant expiresAt) {
        return new CustomerResponse(c.getId(), c.getPhone(), c.getFullName(), c.getEmail(), expiresAt);
    }
}
