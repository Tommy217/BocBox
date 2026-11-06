package com.bocbox.mapper;

import com.bocbox.dto.response.BatchResponse;
import com.bocbox.dto.response.OrderResponse;
import com.bocbox.entity.Batch;
import com.bocbox.entity.Customer;
import com.bocbox.entity.CustomerOrder;

/** Đổi entity đơn/đợt sang dữ liệu trả về API. */
public final class OrderMapper {
    private OrderMapper() {}

    public static BatchResponse toResponse(Batch b) {
        if (b == null) return null;
        return new BatchResponse(b.getId(), b.getCode(), b.getOpenAt(), b.getCloseAt(), b.getDeliveryFrom(), b.getDeliveryTo(), b.getStatus().name());
    }

    public static OrderResponse toResponse(CustomerOrder o) {
        Customer c = o.getCustomer();
        return new OrderResponse(o.getCode(), o.getCreatedAt(), o.getStatus().name(), o.getContentStatus().name(), o.getPrice(),
                o.getGiverName(), o.getRecipientName(), o.getSpyTemplateId(),
                o.getMemeSlug(), o.getColorName(), o.getColorHex(), o.getSizeCode(),
                o.getTextLine1(), o.getTextLine2(), o.getFont(), o.getPosition(), o.getLayoutJson(),
                o.getCardStyle(), o.getCardMessage(),
                o.getShippingName(), o.getShippingPhone(), o.getShippingAddress(), o.getEmail(),
                toResponse(o.getBatch()), o.getKeychainDesign(), o.getCarrier(), o.getTrackingCode(), o.getReviewNote(),
                c == null ? null : c.getFullName(), c == null ? null : c.getPhone());
    }
}
