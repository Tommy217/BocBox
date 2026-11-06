package com.bocbox.controller;

import com.bocbox.dto.response.BatchResponse;
import com.bocbox.dto.response.BatchSummaryResponse;
import com.bocbox.dto.response.OrderResponse;
import com.bocbox.mapper.OrderMapper;
import com.bocbox.service.BatchService;
import com.bocbox.service.OrderService;
import com.bocbox.service.ReportService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Quản trị đợt pre-order: danh sách đợt, chốt đợt (ADMIN), bảng gửi xưởng, bốc khô gấu. */
@RestController
@RequestMapping("/api/v1/admin/batches")
public class AdminBatchController {
    private final BatchService batches;
    private final OrderService orders;
    private final ReportService reports;

    public AdminBatchController(BatchService batches, OrderService orders, ReportService reports) {
        this.batches = batches; this.orders = orders; this.reports = reports;
    }

    @GetMapping
    public List<BatchResponse> list() { return batches.allNewestFirst().stream().map(OrderMapper::toResponse).toList(); }

    /** Chỉ ADMIN (xem SecurityConfig): đóng đợt hiện tại ngay và mở đợt tuần sau. */
    @PostMapping("/close-current")
    public BatchResponse closeCurrent() { return OrderMapper.toResponse(batches.closeCurrentAndOpenNext()); }

    /** Bảng gửi xưởng: số áo theo màu × size (chỉ đơn đã thanh toán). */
    @GetMapping("/{id}/summary")
    public BatchSummaryResponse summary(@PathVariable Long id) { return reports.batchSummary(id); }

    @PostMapping("/{id}/assign-keychains")
    public List<OrderResponse> assignKeychains(@PathVariable Long id) {
        return orders.assignKeychains(id).stream().map(OrderMapper::toResponse).toList();
    }
}
