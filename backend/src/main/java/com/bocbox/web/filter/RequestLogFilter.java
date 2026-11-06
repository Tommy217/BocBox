package com.bocbox.web.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Ghi 1 dòng log cho mỗi request API: method, đường dẫn, mã trả về, thời gian, có gửi token hay không.
 * Đứng ngoài Spring Security (HIGHEST_PRECEDENCE) nên thấy cả request bị chặn 401/403.
 * Tắt bằng bocbox.request-log: false.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@ConditionalOnProperty(name = "bocbox.request-log", havingValue = "true", matchIfMissing = true)
public class RequestLogFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger("bocbox.request");

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        // bỏ preflight CORS của trình duyệt cho đỡ rối
        return "OPTIONS".equals(req.getMethod()) || !req.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        long start = System.nanoTime();
        try {
            chain.doFilter(req, res);
        } finally {
            long ms = (System.nanoTime() - start) / 1_000_000;
            String uri = req.getQueryString() == null ? req.getRequestURI() : req.getRequestURI() + "?" + req.getQueryString();
            String auth = req.getHeader("Authorization") != null ? "token" : "-";
            int status = res.getStatus();
            String line = String.format("%-6s %s -> %d (%d ms) [%s]", req.getMethod(), uri, status, ms, auth);
            if (status >= 500) log.error(line);
            else if (status >= 400) log.warn(line);
            else log.info(line);
        }
    }
}
