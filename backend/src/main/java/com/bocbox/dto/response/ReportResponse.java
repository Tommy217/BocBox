package com.bocbox.dto.response;

import java.util.List;
import java.util.Map;

/** Báo cáo tổng: số box đã thanh toán so với mốc hòa vốn, doanh thu theo đợt, meme được chọn nhiều. */
public record ReportResponse(int paidBoxes, int breakEvenBoxes, long revenue, long grossProfitEstimate,
                             Map<String, Long> memePopularity, List<BatchStatResponse> byBatch, Map<String, Long> byStatus) {}
