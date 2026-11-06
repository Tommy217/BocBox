package com.bocbox.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Đơn trả cho khách và quản trị (customerName/customerPhone = tài khoản đặt, null với đơn cũ). */
public record OrderResponse(String code, LocalDateTime createdAt, String status, String contentStatus, BigDecimal price,
                            String giverName, String recipientName, Long spyTemplateId,
                            String memeSlug, String colorName, String colorHex, String sizeCode,
                            String textLine1, String textLine2, String font, String position, String layoutJson,
                            String cardStyle, String cardMessage,
                            String shippingName, String shippingPhone, String shippingAddress, String email,
                            BatchResponse batch, String keychainDesign, String carrier, String trackingCode, String reviewNote,
                            String customerName, String customerPhone) {}
