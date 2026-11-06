package com.bocbox.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.bocbox.entity.enums.BatchStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Một đợt pre-order theo tuần. */
@Document(collection = "batches")
public class Batch implements SequencedEntity {
    @Id
    private Long id;
    // mã đợt W + yy + số tuần, duy nhất
    private String code;
    private LocalDateTime openAt;
    private LocalDateTime closeAt;
    private LocalDate deliveryFrom;
    private LocalDate deliveryTo;
    private BatchStatus status = BatchStatus.OPEN;

    @Override public Long getId() { return id; }
    @Override public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public LocalDateTime getOpenAt() { return openAt; }
    public void setOpenAt(LocalDateTime openAt) { this.openAt = openAt; }
    public LocalDateTime getCloseAt() { return closeAt; }
    public void setCloseAt(LocalDateTime closeAt) { this.closeAt = closeAt; }
    public LocalDate getDeliveryFrom() { return deliveryFrom; }
    public void setDeliveryFrom(LocalDate deliveryFrom) { this.deliveryFrom = deliveryFrom; }
    public LocalDate getDeliveryTo() { return deliveryTo; }
    public void setDeliveryTo(LocalDate deliveryTo) { this.deliveryTo = deliveryTo; }
    public BatchStatus getStatus() { return status; }
    public void setStatus(BatchStatus status) { this.status = status; }
}
