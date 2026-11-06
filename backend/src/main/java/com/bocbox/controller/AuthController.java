package com.bocbox.controller;

import com.bocbox.dto.request.ChangePasswordRequest;
import com.bocbox.dto.request.StaffLoginRequest;
import com.bocbox.dto.response.StaffLoginResponse;
import com.bocbox.dto.response.StaffUserResponse;
import com.bocbox.entity.StaffUser;
import com.bocbox.security.JwtTokenService;
import com.bocbox.service.StaffAccountService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/** Đăng nhập trang quản trị (nhân viên). Đăng nhập của khách nằm ở CustomerController. */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final StaffAccountService staff;
    private final JwtTokenService tokens;

    public AuthController(StaffAccountService staff, JwtTokenService tokens) { this.staff = staff; this.tokens = tokens; }

    @PostMapping("/login")
    public StaffLoginResponse login(@Valid @RequestBody StaffLoginRequest r, HttpServletRequest req) {
        StaffUser u = staff.login(r.username(), r.password(), req.getRemoteAddr());
        JwtTokenService.IssuedToken t = tokens.issueFor(u);
        return new StaffLoginResponse(t.value(), new StaffUserResponse(u.getUsername(), t.name(), u.getRole().name(), t.expiresAt()));
    }

    /** Kiểm tra token còn hạn, trả thông tin người đang đăng nhập. */
    @GetMapping("/me")
    public StaffUserResponse me(@AuthenticationPrincipal Jwt t) {
        return new StaffUserResponse(t.getSubject(), t.getClaimAsString(JwtTokenService.NAME_CLAIM),
                t.getClaimAsStringList(JwtTokenService.ROLES_CLAIM).get(0), t.getExpiresAt());
    }

    @PostMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal Jwt t, @Valid @RequestBody ChangePasswordRequest r) {
        staff.changePassword(t.getSubject(), r);
    }
}
