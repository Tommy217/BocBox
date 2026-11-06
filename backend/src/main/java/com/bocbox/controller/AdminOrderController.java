package com.bocbox.controller;

import com.bocbox.dto.request.ReviewRequest;
import com.bocbox.dto.request.StatusRequest;
import com.bocbox.dto.response.OrderResponse;
import com.bocbox.mapper.OrderMapper;
import com.bocbox.mapper.OrderResponseAssembler;
import com.bocbox.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Quản trị đơn hàng (STAFF, ADMIN): lọc, xem, duyệt thiết kế, xác nhận chuyển khoản, chuyển trạng thái. */
@RestController
@RequestMapping("/api/v1/admin/orders")
public class AdminOrderController {
    private final OrderService orders;

    private final OrderResponseAssembler assembler;

    public AdminOrderController(OrderResponseAssembler assembler, OrderService orders) { this.assembler = assembler; this.orders = orders; }

    /** Lọc theo đợt, trạng thái và từ khóa (mã đơn, tên, số điện thoại). */
    @GetMapping
    public List<OrderResponse> list(@RequestParam(required = false) Long batchId, @RequestParam(required = false) String status,
                                    @RequestParam(required = false) String q) {
        return assembler.many(orders.search(batchId, status, q));
    }

    @GetMapping("/{code}")
    public OrderResponse get(@PathVariable String code) { return assembler.one(orders.get(code)); }

    @PostMapping("/{code}/confirm-payment")
    public OrderResponse confirmPayment(@PathVariable String code) { return assembler.one(orders.confirmPayment(code)); }

    @PatchMapping("/{code}/content-review")
    public OrderResponse review(@PathVariable String code, @RequestBody ReviewRequest r) {
        return assembler.one(orders.review(code, r.approve(), r.note()));
    }

    @PatchMapping("/{code}/status")
    public OrderResponse status(@PathVariable String code, @Valid @RequestBody StatusRequest r) {
        return assembler.one(orders.setStatus(code, r.status(), r.carrier(), r.trackingCode(), r.note()));
    }
}
