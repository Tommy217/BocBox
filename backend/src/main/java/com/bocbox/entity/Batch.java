package com.bocbox.entity;

import jakarta.persistence.*;
import com.bocbox.entity.enums.BatchStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Một đợt pre-order theo tuần. */
@Entity
@Table(name = "batches")
public class Batch {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 20)
    private String code;
    private LocalDateTime openAt;
    private LocalDateTime closeAt;
    private LocalDate deliveryFrom;
    private LocalDate deliveryTo;
    @Enumerated(EnumType.STRING) @Column(length = 20)
    private BatchStatus status = BatchStatus.OPEN;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
