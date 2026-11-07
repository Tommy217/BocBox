package com.bocbox.dto.response;

import java.time.LocalDateTime;

/** Một mẫu trong "Mẫu của tôi"; các trường thiết kế giống đơn hàng nên frontend dựng lại áo như đơn (designFromOrder). */
public record SavedDesignResponse(Long id, String name, String memeSlug, String colorHex, String textLine1, String textLine2,
                                  String font, String position, String layoutJson, LocalDateTime createdAt) {}
