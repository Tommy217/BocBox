package com.bocbox.dto.response;

import java.math.BigDecimal;

/** Thông tin chuyển khoản + link ảnh VietQR; nội dung chuyển khoản = mã đơn. */
public record PaymentQrResponse(String orderCode, BigDecimal amount, String bankId, String accountNo,
                                String accountName, String transferContent, String qrImageUrl) {}
