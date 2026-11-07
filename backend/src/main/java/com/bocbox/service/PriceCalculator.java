package com.bocbox.service;

import com.bocbox.config.BocboxProperties;
import org.springframework.stereotype.Component;

/**
 * Tính giá một box theo tùy chọn in (bảng giá ở bocbox.pricing). Frontend có bản sao ở lib/pricing.ts,
 * nhưng giá ghi vào đơn luôn do backend tính lại.
 */
@Component
public class PriceCalculator {
    private final BocboxProperties.Pricing p;

    public PriceCalculator(BocboxProperties props) { this.p = props.pricing(); }

    /**
     * @param layerCount số meme/ảnh trên áo (0–4)
     * @param cardStyle  SPY | MEME | PLAIN; thiệp meme chỉ tính thêm khi áo có meme để in lên thiệp
     */
    public long priceOf(int layerCount, String cardStyle) {
        long price = p.base();
        if (layerCount >= 2) price += p.extraMemes();
        if ("MEME".equals(cardStyle) && layerCount >= 1) price += p.memeCard();
        return price;
    }

    public BocboxProperties.Pricing pricing() { return p; }
}
