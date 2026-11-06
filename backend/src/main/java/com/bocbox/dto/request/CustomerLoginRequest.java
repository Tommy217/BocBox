package com.bocbox.dto.request;

import jakarta.validation.constraints.*;

public record CustomerLoginRequest(@NotBlank(message = "Nhập số điện thoại") String phone,
                                   @NotBlank(message = "Nhập mật khẩu") @Size(max = 100) String password) {}
