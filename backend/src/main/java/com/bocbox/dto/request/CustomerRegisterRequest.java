package com.bocbox.dto.request;

import jakarta.validation.constraints.*;

public record CustomerRegisterRequest(
        @NotBlank @Pattern(regexp = "0\\d{9}", message = "Số điện thoại gồm 10 số, bắt đầu bằng 0") String phone,
        @NotBlank @Size(min = 8, max = 100, message = "Mật khẩu từ 8 ký tự") String password,
        @NotBlank @Size(max = 100, message = "Tên tối đa 100 ký tự") String fullName,
        @Email(message = "Email không hợp lệ") @Size(max = 120) String email) {}
