package com.bocbox.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Toàn bộ cấu hình riêng của BocBox (mục bocbox.* trong application.yml), gom một chỗ thay cho @Value rải rác.
 * Giá trị bí mật (jwt.secret) lấy từ config/bocbox-local.yml hoặc biến môi trường.
 */
@ConfigurationProperties(prefix = "bocbox")
public record BocboxProperties(
        /** Giá 1 box (đồng). */
        long price,
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

    /** Mốc báo cáo: số box hòa vốn mỗi tháng và lãi gộp ước tính mỗi box. */
    public record Report(@DefaultValue("21") int breakEvenBoxes, @DefaultValue("145000") long grossProfitPerBox) {}
}
