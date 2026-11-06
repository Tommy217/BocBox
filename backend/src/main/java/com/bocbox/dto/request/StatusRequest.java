package com.bocbox.dto.request;

import jakarta.validation.constraints.*;
import com.bocbox.entity.enums.OrderStatus;

/** Chuyển trạng thái đơn; note dùng làm lý do (vd. từ chối đơn). */
public record StatusRequest(@NotNull OrderStatus status, String carrier, String trackingCode,
                            @Size(max = 300) String note) {}
