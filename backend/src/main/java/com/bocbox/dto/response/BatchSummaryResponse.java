package com.bocbox.dto.response;

import java.util.Map;

/** Tổng hợp một đợt gửi xưởng: số áo theo màu × size (chỉ đơn đã thanh toán). */
public record BatchSummaryResponse(int totalOrders, int paidOrders, long revenue, long awaitingReview,
                                   Map<String, Map<String, Long>> colorBySize) {}
