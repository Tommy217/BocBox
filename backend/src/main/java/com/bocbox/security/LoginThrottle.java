package com.bocbox.security;

import com.bocbox.config.BocboxProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Chặn dò mật khẩu: sai liên tiếp quá ngưỡng (theo tên đăng nhập, và theo địa chỉ IP) thì khóa lock-minutes phút.
 * Lưu trong RAM nên khởi động lại backend là xóa; đủ cho một máy chủ.
 */
@Component
public class LoginThrottle {
    private record Entry(int failures, Instant lockedUntil) {}
    private final ConcurrentHashMap<String, Entry> entries = new ConcurrentHashMap<>();
    private final int maxFailures;
    private final Duration lock;

    public LoginThrottle(BocboxProperties props) {
        this.maxFailures = props.login().maxFailures(); this.lock = Duration.ofMinutes(props.login().lockMinutes());
    }

    /** Số phút còn bị khóa (0 = không khóa). */
    public long lockedMinutes(String... keys) {
        Instant now = Instant.now();
        long max = 0;
        for (String k : keys) {
            Entry e = entries.get(k);
            if (e != null && e.lockedUntil() != null && e.lockedUntil().isAfter(now))
                max = Math.max(max, Duration.between(now, e.lockedUntil()).toMinutes() + 1);
        }
        return max;
    }

    /** Khóa "u:tên" sau maxFailures lần; khóa "ip:..." nới gấp 4 để một người gõ nhầm không chặn cả văn phòng chung mạng. */
    public void failed(String... keys) {
        for (String k : keys) entries.compute(k, (key, e) -> {
            int limit = key.startsWith("ip:") ? maxFailures * 4 : maxFailures;
            int n = (e == null || e.lockedUntil() != null && e.lockedUntil().isBefore(Instant.now()) ? 0 : e.failures()) + 1;
            return new Entry(n, n >= limit ? Instant.now().plus(lock) : null);
        });
    }

    public void succeeded(String... keys) { for (String k : keys) entries.remove(k); }
}
