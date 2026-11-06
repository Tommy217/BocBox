package com.bocbox.dto.request;

import jakarta.validation.constraints.*;

/** Khách đặt hoặc sửa đơn: thiết kế áo (bố cục trong layoutJson), tag, thiệp, giao hàng. */
public record CreateOrderRequest(
        @NotBlank @Size(max = 100) String giverName,
        @NotBlank @Size(max = 100) String recipientName,
        Long spyTemplateId,
        @Size(max = 50) String memeSlug,   // chỉ client cũ dùng; bản mới gửi bố cục trong layoutJson
        @NotBlank String colorHex,
        @NotBlank @Pattern(regexp = "S|M|L|XL|XXL") String sizeCode,
        @Size(max = 28) String textLine1,
        @Size(max = 28) String textLine2,
        @NotBlank String font,
        @Pattern(regexp = "CHEST|CENTER") String position,
        @Size(max = 2000) String layoutJson,
        @Pattern(regexp = "SPY|MEME|PLAIN") String cardStyle,
        @Size(max = 300, message = "Lời nhắn tối đa 300 ký tự") String cardMessage,
        @NotBlank String shippingName,
        @NotBlank @Pattern(regexp = "0\\d{9}", message = "Số điện thoại gồm 10 số, bắt đầu bằng 0") String shippingPhone,
        @NotBlank @Size(max = 300) String shippingAddress,
        @Email String email) {}
