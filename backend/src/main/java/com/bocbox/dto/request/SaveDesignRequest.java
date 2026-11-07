package com.bocbox.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Lưu thiết kế áo vào "Mẫu của tôi". */
public record SaveDesignRequest(
        @NotBlank(message = "Đặt tên cho mẫu nhé") @Size(max = 40, message = "Tên mẫu tối đa 40 ký tự") String name,
        @NotBlank String colorHex,
        @Size(max = 28) String textLine1,
        @Size(max = 28) String textLine2,
        @NotBlank String font,
        @Size(max = 2000) String layoutJson) {}
