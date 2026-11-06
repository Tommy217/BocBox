package com.bocbox.service;

import com.bocbox.config.BocboxProperties;
import com.bocbox.dto.response.BatchStatResponse;
import com.bocbox.dto.response.BatchSummaryResponse;
import com.bocbox.dto.response.ReportResponse;
import com.bocbox.entity.CustomImage;
import com.bocbox.entity.CustomerOrder;
import com.bocbox.entity.enums.ContentStatus;
import com.bocbox.entity.enums.OrderStatus;
import com.bocbox.repository.BatchRepository;
import com.bocbox.repository.CustomerOrderRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

/** Số liệu cho quản trị: tổng hợp một đợt gửi xưởng và báo cáo doanh thu. */
@Service
public class ReportService {
    private final CustomerOrderRepository orders;
    private final BatchRepository batches;
    private final BocboxProperties.Report cfg;

    public ReportService(CustomerOrderRepository orders, BatchRepository batches, BocboxProperties props) {
        this.orders = orders; this.batches = batches; this.cfg = props.report();
    }

    private static long revenue(List<CustomerOrder> l) { return l.stream().mapToLong(o -> o.getPrice()).sum(); }

    /** Bảng gửi xưởng: số áo theo màu × size (chỉ đơn đã thanh toán), kèm số đơn còn chờ duyệt. */
    public BatchSummaryResponse batchSummary(Long batchId) {
        List<CustomerOrder> list = orders.findByBatchIdOrderByCreatedAtAsc(batchId);
        List<CustomerOrder> paid = list.stream().filter(o -> o.getStatus().isPaid()).toList();
        Map<String, Map<String, Long>> grid = paid.stream().collect(Collectors.groupingBy(CustomerOrder::getColorName,
                TreeMap::new, Collectors.groupingBy(CustomerOrder::getSizeCode, TreeMap::new, Collectors.counting())));
        // chờ duyệt = đơn mới chưa duyệt + đơn đã trả tiền nhưng nội dung chưa đạt (vd. in lại)
        long awaiting = list.stream().filter(o -> o.getStatus() == OrderStatus.PENDING_APPROVAL
                || o.getStatus().isPaid() && o.getContentStatus() != ContentStatus.APPROVED).count();
        return new BatchSummaryResponse(list.size(), paid.size(), revenue(paid), awaiting, grid);
    }

    /** Báo cáo tổng: số box đã thanh toán so với mốc hòa vốn, meme được chọn nhiều, doanh thu theo đợt, số đơn theo trạng thái. */
    public ReportResponse report() {
        List<CustomerOrder> all = orders.findAll();
        List<CustomerOrder> paid = all.stream().filter(o -> o.getStatus().isPaid()).toList();
        // chỉ đếm meme có sẵn (bỏ áo chỉ có chữ và ảnh khách tự tải lên)
        Map<String, Long> memeCount = paid.stream()
                .filter(o -> o.getMemeSlug() != null && !CustomImage.isUploadSlug(o.getMemeSlug()))
                .collect(Collectors.groupingBy(CustomerOrder::getMemeSlug, Collectors.counting()));
        Map<Long, List<CustomerOrder>> byBatch = all.stream().filter(o -> o.getBatchId() != null)
                .collect(Collectors.groupingBy(CustomerOrder::getBatchId));
        List<BatchStatResponse> stats = batches.findAllByOrderByOpenAtDesc().stream().map(b -> {
            List<CustomerOrder> l = byBatch.getOrDefault(b.getId(), List.of());
            List<CustomerOrder> p = l.stream().filter(o -> o.getStatus().isPaid()).toList();
            return new BatchStatResponse(b.getCode(), b.getStatus().name(), b.getOpenAt(), l.size(), p.size(), revenue(p));
        }).toList();
        Map<String, Long> byStatus = all.stream().collect(Collectors.groupingBy(o -> o.getStatus().name(), TreeMap::new, Collectors.counting()));
        return new ReportResponse(paid.size(), cfg.breakEvenBoxes(), revenue(paid), paid.size() * cfg.grossProfitPerBox(),
                memeCount, stats, byStatus);
    }
}
