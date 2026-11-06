package com.bocbox.dto.request;

import jakarta.validation.constraints.*;

/** Dùng chung cho nhân viên và khách tự đổi mật khẩu. */
public record ChangePasswordRequest(@NotBlank String currentPassword,
                                    @NotBlank @Size(min = 8, max = 100, message = "Mật khẩu mới từ 8 ký tự") String newPassword) {}
