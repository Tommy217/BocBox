package com.bocbox.security;

import com.bocbox.config.BocboxProperties;
import com.bocbox.entity.Customer;
import com.bocbox.entity.StaffUser;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Cấp JWT HS256 cho cả nhân viên và khách (một chỗ duy nhất).
 * Nhân viên: subject = username, roles = [STAFF|ADMIN]. Khách: subject = "customer:{id}", roles = [CUSTOMER].
 */
@Service
public class JwtTokenService {
    public static final String CUSTOMER_SUBJECT_PREFIX = "customer:";
    public static final String ROLES_CLAIM = "roles";
    public static final String NAME_CLAIM = "name";
    public static final String CUSTOMER_ROLE = "CUSTOMER";

    /** Token đã ký kèm thời điểm hết hạn. */
    public record IssuedToken(String value, String name, Instant expiresAt) {}

    private final JwtEncoder encoder;
    private final Duration staffTtl, customerTtl;

    public JwtTokenService(JwtEncoder encoder, BocboxProperties props) {
        this.encoder = encoder;
        this.staffTtl = Duration.ofHours(props.jwt().ttlHours());
        this.customerTtl = Duration.ofDays(props.jwt().customerTtlDays());
    }

    public IssuedToken issueFor(StaffUser u) {
        String name = u.getDisplayName() == null ? u.getUsername() : u.getDisplayName();
        return issue(u.getUsername(), u.getRole().name(), name, staffTtl);
    }

    public IssuedToken issueFor(Customer c) {
        return issue(CUSTOMER_SUBJECT_PREFIX + c.getId(), CUSTOMER_ROLE, c.getFullName(), customerTtl);
    }

    /** id tài khoản khách trong token, rỗng nếu token không phải của khách. */
    public static Optional<Long> customerId(Jwt t) {
        String sub = t.getSubject();
        if (sub == null || !sub.startsWith(CUSTOMER_SUBJECT_PREFIX)) return Optional.empty();
        try { return Optional.of(Long.parseLong(sub.substring(CUSTOMER_SUBJECT_PREFIX.length()))); }
        catch (NumberFormatException e) { return Optional.empty(); }
    }

    private IssuedToken issue(String subject, String role, String name, Duration ttl) {
        Instant now = Instant.now(), exp = now.plus(ttl);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("bocbox").subject(subject).issuedAt(now).expiresAt(exp)
                .claim(ROLES_CLAIM, List.of(role)).claim(NAME_CLAIM, name)
                .build();
        String token = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new IssuedToken(token, name, exp);
    }
}
