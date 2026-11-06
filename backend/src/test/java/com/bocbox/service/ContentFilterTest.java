package com.bocbox.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ContentFilterTest {
    private final ContentFilter filter = new ContentFilter();

    @Test
    void ganCoTuCam() {
        assertTrue(filter.isSuspicious("Đồ ngu ngơ", null));
        assertTrue(filter.isSuspicious(null, "vcl thật"));
    }

    @Test
    void khongGanCoNhamKhiGiuDau() {
        assertFalse(filter.isSuspicious("Ngủ ngon nhé", "lớn rồi"));
        assertFalse(filter.isSuspicious(null, "", "  "));
    }
}
