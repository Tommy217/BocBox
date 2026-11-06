package com.bocbox.controller;

import com.bocbox.dto.request.CreateStaffRequest;
import com.bocbox.dto.request.ResetPasswordRequest;
import com.bocbox.dto.request.UpdateStaffRequest;
import com.bocbox.dto.response.StaffResponse;
import com.bocbox.mapper.AccountMapper;
import com.bocbox.service.StaffAccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Quản lý tài khoản nhân viên, chỉ ADMIN (xem SecurityConfig). Không xóa tài khoản, chỉ khóa để giữ lịch sử. */
@RestController
@RequestMapping("/api/v1/admin/staff")
public class StaffController {
    private final StaffAccountService staff;

    public StaffController(StaffAccountService staff) { this.staff = staff; }

    @GetMapping
    public List<StaffResponse> list() { return staff.list().stream().map(AccountMapper::toResponse).toList(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StaffResponse create(@Valid @RequestBody CreateStaffRequest r) { return AccountMapper.toResponse(staff.create(r)); }

    @PutMapping("/{id}")
    public StaffResponse update(@PathVariable Long id, @Valid @RequestBody UpdateStaffRequest r, @AuthenticationPrincipal Jwt me) {
        return AccountMapper.toResponse(staff.update(id, r, me.getSubject()));
    }

    @PostMapping("/{id}/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest r) { staff.resetPassword(id, r.password()); }
}
