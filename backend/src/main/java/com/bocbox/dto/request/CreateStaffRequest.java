package com.bocbox.dto.request;

import jakarta.validation.constraints.*;
import com.bocbox.entity.enums.StaffRole;

public record CreateStaffRequest(
        @NotBlank @Pattern(regexp = "[a-z0-9._]{3,30}", message = "Tên đăng nhập 3–30 ký tự: chữ thường, số, dấu chấm, gạch dưới") String username,
        @NotBlank @Size(max = 100) String displayName,
        @NotNull StaffRole role,
        @NotBlank @Size(min = 8, max = 100, message = "Mật khẩu từ 8 ký tự") String password) {}
