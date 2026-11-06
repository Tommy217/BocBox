package com.bocbox.security;

import com.bocbox.config.BocboxProperties;
import com.bocbox.repository.CustomerRepository;
import com.bocbox.repository.StaffUserRepository;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;

/** Khóa ký, bộ ký và bộ kiểm tra JWT. */
@Configuration
public class JwtConfig {

    @Bean
    public SecretKey jwtKey(BocboxProperties props) {
        byte[] bytes = props.jwt().secret().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32)
            throw new IllegalStateException("Chưa đặt JWT_SECRET hoặc quá ngắn (cần ít nhất 32 ký tự)");
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    public JwtEncoder jwtEncoder(SecretKey key) { return new NimbusJwtEncoder(new ImmutableSecret<>(key)); }

    /**
     * Ngoài chữ ký và hạn dùng, token chỉ hợp lệ khi tài khoản còn hoạt động và quyền chưa bị đổi
     * (khóa nhân viên / khách là có hiệu lực ngay, không chờ token hết hạn).
     */
    @Bean
    public JwtDecoder jwtDecoder(SecretKey key, StaffUserRepository staff, CustomerRepository customers) {
        NimbusJwtDecoder d = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        OAuth2TokenValidator<Jwt> accountActive = t -> {
            List<String> roles = t.getClaimAsStringList(JwtTokenService.ROLES_CLAIM);
            boolean ok;
            if (roles != null && roles.contains(JwtTokenService.CUSTOMER_ROLE)) {
                ok = JwtTokenService.customerId(t).flatMap(customers::findById).filter(c -> c.isActive()).isPresent();
            } else {
                ok = roles != null && staff.findByUsername(t.getSubject())
                        .filter(u -> u.isActive() && roles.contains(u.getRole().name())).isPresent();
            }
            return ok ? OAuth2TokenValidatorResult.success()
                    : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Tài khoản đã bị khóa hoặc đổi quyền", null));
        };
        d.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefault(), accountActive));
        return d;
    }
}
