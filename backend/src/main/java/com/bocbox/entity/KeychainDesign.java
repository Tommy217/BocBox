package com.bocbox.entity;

import jakarta.persistence.*;

/** Một mẫu khô gấu (móc khóa thú bông) trong series; tồn kho giảm khi bốc cho đơn. */
@Entity
@Table(name = "keychain_designs")
public class KeychainDesign {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 100)
    private String seriesName;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(nullable = false, length = 50)
    private String slug;
    private int stockQty;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSeriesName() { return seriesName; }
    public void setSeriesName(String seriesName) { this.seriesName = seriesName; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public int getStockQty() { return stockQty; }
    public void setStockQty(int stockQty) { this.stockQty = stockQty; }
}
