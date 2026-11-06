package com.bocbox.entity.enums;

import java.util.EnumSet;
import java.util.Set;

/**
 * Trạng thái đơn. Luồng: khách đặt → PENDING_APPROVAL, quản trị duyệt thiết kế → PENDING_PAYMENT (khách thấy mã VietQR)
 * → PAID → PRINTING → PACKING → SHIPPING → DELIVERED. Giữ {@link #next()} giống NEXT_STATUS trong frontend/src/lib/types.ts.
 */
public enum OrderStatus {
    PENDING_APPROVAL, PENDING_PAYMENT, PAID, PRINTING, PACKING, SHIPPING, DELIVERED, CANCELLED, REPRINT;

    /** Các trạng thái được phép chuyển tới. */
    public Set<OrderStatus> next() {
        return switch (this) {
            case PENDING_APPROVAL -> EnumSet.of(PENDING_PAYMENT, CANCELLED); // sang PENDING_PAYMENT = duyệt đơn
            case PENDING_PAYMENT -> EnumSet.of(PAID, CANCELLED);
            case PAID -> EnumSet.of(PRINTING, CANCELLED);
            case PRINTING -> EnumSet.of(PACKING, REPRINT);
            case REPRINT -> EnumSet.of(PRINTING);
            case PACKING -> EnumSet.of(SHIPPING, REPRINT);
            case SHIPPING -> EnumSet.of(DELIVERED);
            case DELIVERED -> EnumSet.of(REPRINT);
            case CANCELLED -> EnumSet.noneOf(OrderStatus.class);
        };
    }

    /** Đã trả tiền (tính doanh thu, vào sản xuất, được bốc khô gấu): không phải chờ duyệt, chờ thanh toán hay đã hủy. */
    public boolean isPaid() {
        return this != PENDING_APPROVAL && this != PENDING_PAYMENT && this != CANCELLED;
    }
}
