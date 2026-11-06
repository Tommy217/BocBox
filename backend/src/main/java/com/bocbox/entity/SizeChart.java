package com.bocbox.entity;

import jakarta.persistence.*;

/** Bảng size theo chiều cao (cm) và cân nặng (kg). */
@Entity
@Table(name = "sizes")
public class SizeChart {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 5)
    private String code;
    private int minHeight;
    private int maxHeight;
    private int minWeight;
    private int maxWeight;
    private int sortOrder;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public int getMinHeight() { return minHeight; }
    public void setMinHeight(int minHeight) { this.minHeight = minHeight; }
    public int getMaxHeight() { return maxHeight; }
    public void setMaxHeight(int maxHeight) { this.maxHeight = maxHeight; }
    public int getMinWeight() { return minWeight; }
    public void setMinWeight(int minWeight) { this.minWeight = minWeight; }
    public int getMaxWeight() { return maxWeight; }
    public void setMaxWeight(int maxWeight) { this.maxWeight = maxWeight; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
