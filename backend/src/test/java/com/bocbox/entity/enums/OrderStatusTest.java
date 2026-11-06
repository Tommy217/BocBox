package com.bocbox.entity.enums;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Luồng trạng thái đơn phải khớp NEXT_STATUS ở frontend/src/lib/types.ts. */
class OrderStatusTest {

    @Test
    void donMoiChiDuocDuyetHoacHuy() {
        assertEquals(java.util.Set.of(OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED), OrderStatus.PENDING_APPROVAL.next());
    }

    @Test
    void khongNhayCoc() {
        assertFalse(OrderStatus.PENDING_APPROVAL.next().contains(OrderStatus.PAID));
        assertFalse(OrderStatus.PENDING_PAYMENT.next().contains(OrderStatus.PRINTING));
        assertTrue(OrderStatus.CANCELLED.next().isEmpty());
    }

    @Test
    void chiDonDaTraTienMoiTinhDoanhThu() {
        assertFalse(OrderStatus.PENDING_APPROVAL.isPaid());
        assertFalse(OrderStatus.PENDING_PAYMENT.isPaid());
        assertFalse(OrderStatus.CANCELLED.isPaid());
        assertTrue(OrderStatus.PAID.isPaid());
        assertTrue(OrderStatus.DELIVERED.isPaid());
        assertTrue(OrderStatus.REPRINT.isPaid());
    }
}
