package com.bocbox.config;

import com.bocbox.security.JwtTokenService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;

import java.io.IOException;

/**
 * Phân quyền API (JWT HS256, cấp ở security/JwtTokenService):
 * - Khách vãng lai: danh mục, đợt đang mở, gợi ý size, ảnh tải lên — không cần token.
 * - CUSTOMER: /api/v1/customer/** (đặt đơn, đơn của tôi, tải ảnh), trừ register / login.
 * - STAFF: /api/v1/admin/** (xử lý đơn, kho). ADMIN thêm: chốt đợt, báo cáo, ẩn/hiện meme, quản lý nhân viên.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        JwtGrantedAuthoritiesConverter roles = new JwtGrantedAuthoritiesConverter();
        roles.setAuthoritiesClaimName(JwtTokenService.ROLES_CLAIM);
        roles.setAuthorityPrefix("ROLE_");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(roles);

        AuthenticationEntryPoint unauthorized = (req, res, e) ->
                json(res, HttpServletResponse.SC_UNAUTHORIZED, "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn");
        AccessDeniedHandler forbidden = (req, res, e) ->
                json(res, HttpServletResponse.SC_FORBIDDEN, "Tài khoản không có quyền làm việc này");

        http.csrf(c -> c.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/admin/batches/close-current").hasRole("ADMIN")
                        .requestMatchers("/api/v1/admin/reports/**", "/api/v1/admin/staff/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/admin/memes/**").hasRole("ADMIN")
                        .requestMatchers("/api/v1/admin/**", "/api/v1/auth/me", "/api/v1/auth/password").hasAnyRole("STAFF", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/customer/register", "/api/v1/customer/login").permitAll()
                        .requestMatchers("/api/v1/customer/**").hasRole(JwtTokenService.CUSTOMER_ROLE)
                        .anyRequest().permitAll())
                .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(converter))
                        .authenticationEntryPoint(unauthorized).accessDeniedHandler(forbidden))
                .exceptionHandling(e -> e.authenticationEntryPoint(unauthorized).accessDeniedHandler(forbidden));
        return http.build();
    }

    private static void json(HttpServletResponse res, int status, String message) throws IOException {
        res.setStatus(status);
        res.setContentType("application/json;charset=UTF-8");
        res.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
