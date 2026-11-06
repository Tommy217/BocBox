package com.bocbox.service;

import com.bocbox.entity.Batch;
import com.bocbox.entity.enums.BatchStatus;
import com.bocbox.repository.BatchRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.WeekFields;
import java.util.List;

/** Đợt pre-order: mở thứ Hai, đóng Chủ nhật 23:59, in thứ Hai–Tư, giao thứ Năm–Sáu tuần sau. */
@Service
public class BatchService {
    public static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private final BatchRepository batches;

    public BatchService(BatchRepository batches) { this.batches = batches; }

    /** Đợt đang nhận đơn. Đợt mở đã quá giờ đóng (ví dụ server tắt lúc 23:59 Chủ nhật) thì đóng luôn và mở đợt của tuần hiện tại. */
    @Transactional
    public Batch currentOpenBatch() {
        Batch b = batches.findFirstByStatusOrderByOpenAtDesc(BatchStatus.OPEN).orElse(null);
        if (b != null && LocalDateTime.now(VN).isAfter(b.getCloseAt())) {
            b.setStatus(BatchStatus.CLOSED);
            batches.save(b);
            b = null;
        }
        return b != null ? b : createBatchFor(LocalDate.now(VN));
    }

    /** Mọi đợt, mới nhất trước (đảm bảo luôn có đợt đang mở). */
    @Transactional
    public List<Batch> allNewestFirst() {
        currentOpenBatch();
        return batches.findAllByOrderByOpenAtDesc();
    }

    @Transactional
    public Batch createBatchFor(LocalDate day) {
        LocalDate monday = day.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate sunday = monday.plusDays(6);
        int week = monday.get(WeekFields.ISO.weekOfWeekBasedYear());
        String code = "W" + monday.format(DateTimeFormatter.ofPattern("yy")) + String.format("%02d", week);
        if (batches.existsByCode(code)) code = code + "-" + System.currentTimeMillis() % 1000;
        Batch b = new Batch();
        b.setCode(code);
        b.setOpenAt(monday.atStartOfDay());
        b.setCloseAt(sunday.atTime(23, 59, 59));
        b.setDeliveryFrom(sunday.plusDays(4)); // thứ Năm tuần sau
        b.setDeliveryTo(sunday.plusDays(5));   // thứ Sáu tuần sau
        b.setStatus(BatchStatus.OPEN);
        return batches.save(b);
    }

    /** Admin bấm tay: đóng đợt hiện tại ngay và mở đợt tuần sau. */
    @Transactional
    public Batch closeCurrentAndOpenNext() {
        Batch current = currentOpenBatch();
        current.setStatus(BatchStatus.CLOSED);
        batches.save(current);
        return createBatchFor(current.getCloseAt().toLocalDate().plusDays(1));
    }

    /** Đợt còn nhận sửa/hủy đơn: đang mở và chưa quá giờ chốt. */
    public static boolean isOpen(Batch b) {
        return b != null && b.getStatus() == BatchStatus.OPEN && !LocalDateTime.now(VN).isAfter(b.getCloseAt());
    }

    /** 00:00 thứ Hai: đợt cũ đã qua 23:59:59 Chủ nhật nên currentOpenBatch() tự đóng nó và mở đợt mới. */
    @Scheduled(cron = "0 0 0 * * MON", zone = "Asia/Ho_Chi_Minh")
    public void scheduledClose() { currentOpenBatch(); }
}
