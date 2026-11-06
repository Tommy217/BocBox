package com.bocbox.dto.request;

import jakarta.validation.constraints.*;

public record ResetPasswordRequest(@NotBlank @Size(min = 8, max = 100, message = "Mật khẩu từ 8 ký tự") String password) {}
