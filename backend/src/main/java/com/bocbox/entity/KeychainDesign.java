package com.bocbox.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** Một mẫu khô gấu (móc khóa thú bông) trong series; tồn kho giảm khi bốc cho đơn. */
@Document(collection = "keychain_designs")
public class KeychainDesign implements SequencedEntity {
    @Id
    private Long id;
    private String seriesName;
    private String name;
    private String slug;
    private int stockQty;

    @Override public Long getId() { return id; }
    @Override public void setId(Long id) { this.id = id; }
    public String getSeriesName() { return seriesName; }
    public void setSeriesName(String seriesName) { this.seriesName = seriesName; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public int getStockQty() { return stockQty; }
    public void setStockQty(int stockQty) { this.stockQty = stockQty; }
}
