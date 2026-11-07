package com.bocbox.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Toàn bộ cấu hình riêng của BocBox (mục bocbox.* trong application.yml), gom một chỗ thay cho @Value rải rác.
 * Giá trị bí mật (jwt.secret) lấy từ config/bocbox-local.yml hoặc biến môi trường.
 */
@ConfigurationProperties(prefix = "bocbox")
public record BocboxProperties(
        /** Bảng giá box theo tùy chọn in (đồng), xem service/PriceCalculator. */
        @DefaultValue Pricing pricing,
        /** Các origin frontend được gọi API, cách nhau bởi dấu phẩy. */
        @DefaultValue("http://localhost:5173") String corsOrigins,
        Payment payment,
        Jwt jwt,
        @DefaultValue Login login,
        @DefaultValue Report report) {

    /** Tài khoản nhận chuyển khoản VietQR. */
    public record Payment(String bankId, String accountNo, String accountName) {}

    /** secret ≥ 32 ký tự; ttlHours: phiên nhân viên; customerTtlDays: phiên khách. */
    public record Jwt(@DefaultValue("") String secret, @DefaultValue("12") long ttlHours, @DefaultValue("30") long customerTtlDays) {}

    /** Sai mật khẩu quá maxFailures lần thì khóa đăng nhập lockMinutes phút. */
    public record Login(@DefaultValue("5") int maxFailures, @DefaultValue("15") long lockMinutes) {}

    /**
     * Giá box: base = áo 1 meme/ảnh (hoặc chỉ chữ) + khô gấu + tag + thiệp điệp viên/trơn;
     * extraMemes cộng một lần khi áo có 2–4 meme/ảnh; memeCard cộng khi chọn thiệp meme in màu.
     */
    public record Pricing(@DefaultValue("275000") long base, @DefaultValue("15000") long extraMemes, @DefaultValue("9000") long memeCard) {
        public long max() { return base + extraMemes + memeCard; }
    }

    /** Số liệu tính hòa vốn: giá vốn mỗi box và chi phí cố định mỗi tháng (đồng). */
    public record Report(@DefaultValue("205000") long unitCost, @DefaultValue("3045000") long fixedCostPerMonth) {}
}
