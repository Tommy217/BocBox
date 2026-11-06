package com.bocbox.service;

import com.bocbox.dto.request.ChangePasswordRequest;
import com.bocbox.dto.request.CreateStaffRequest;
import com.bocbox.dto.request.UpdateStaffRequest;
import com.bocbox.entity.StaffUser;
import com.bocbox.entity.enums.StaffRole;
import com.bocbox.exception.AppException;
import com.bocbox.repository.StaffUserRepository;
import com.bocbox.security.LoginThrottle;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/** Tài khoản nhân viên: đăng nhập trang quản trị, đổi mật khẩu, ADMIN quản lý nhân viên (không xóa, chỉ khóa để giữ lịch sử). */
@Service
public class StaffAccountService {
    private final StaffUserRepository users;
    private final PasswordEncoder passwords;
    private final LoginThrottle throttle;
    /** Băm sẵn để khi sai tên đăng nhập vẫn tốn thời gian như sai mật khẩu (không dò được tên tài khoản). */
    private final String dummyHash;

    public StaffAccountService(StaffUserRepository users, PasswordEncoder passwords, LoginThrottle throttle) {
        this.users = users; this.passwords = passwords; this.throttle = throttle;
        this.dummyHash = passwords.encode("bocbox-dummy");
    }

    public StaffUser login(String rawUsername, String password, String clientIp) {
        String username = rawUsername.trim().toLowerCase();
        String[] keys = { "u:" + username, "ip:" + clientIp };
        long locked = throttle.lockedMinutes(keys);
        if (locked > 0) throw AppException.tooManyRequests("Sai mật khẩu quá nhiều lần, thử lại sau " + locked + " phút");
        StaffUser u = users.findByUsername(username).filter(StaffUser::isActive).orElse(null);
        boolean ok = passwords.matches(password, u == null ? dummyHash : u.getPasswordHash());
        if (u == null || !ok) {
            throttle.failed(keys);
            throw AppException.unauthorized("Sai tên đăng nhập hoặc mật khẩu");
        }
        throttle.succeeded(keys);
        u.setLastLoginAt(LocalDateTime.now(BatchService.VN));
        return users.save(u);
    }

    /** Nhân viên tự đổi mật khẩu, phải nhập đúng mật khẩu hiện tại. */
    public void changePassword(String username, ChangePasswordRequest r) {
        StaffUser u = users.findByUsername(username).filter(StaffUser::isActive)
                .orElseThrow(() -> AppException.unauthorized("Tài khoản không còn hoạt động"));
        if (!passwords.matches(r.currentPassword(), u.getPasswordHash())) throw AppException.invalid("Mật khẩu hiện tại không đúng");
        u.setPasswordHash(passwords.encode(r.newPassword()));
        users.save(u);
    }

    /** ADMIN trước, rồi theo tên đăng nhập. */
    public List<StaffUser> list() {
        return users.findAll().stream()
                .sorted(Comparator.comparing(StaffUser::getRole).reversed().thenComparing(StaffUser::getUsername)).toList();
    }

    public StaffUser create(CreateStaffRequest r) {
        if (users.findByUsername(r.username()).isPresent()) throw AppException.conflict("Tên đăng nhập đã có người dùng");
        StaffUser u = new StaffUser();
        u.setUsername(r.username());
        u.setDisplayName(r.displayName().trim());
        u.setRole(r.role());
        u.setPasswordHash(passwords.encode(r.password()));
        u.setCreatedAt(LocalDateTime.now(BatchService.VN));
        return users.save(u);
    }

    /** Không cho tự khóa / tự hạ quyền, và luôn phải còn ít nhất một ADMIN đang hoạt động. */
    public StaffUser update(Long id, UpdateStaffRequest r, String currentUsername) {
        StaffUser u = find(id);
        boolean losesAdmin = u.getRole() == StaffRole.ADMIN && u.isActive() && (r.role() != StaffRole.ADMIN || !r.active());
        if (losesAdmin && u.getUsername().equals(currentUsername))
            throw AppException.conflict("Không tự khóa hoặc tự hạ quyền tài khoản đang đăng nhập");
        if (losesAdmin && users.findAll().stream().filter(x -> x.isActive() && x.getRole() == StaffRole.ADMIN).count() <= 1)
            throw AppException.conflict("Phải còn ít nhất một quản trị đang hoạt động");
        u.setDisplayName(r.displayName().trim());
        u.setRole(r.role());
        u.setActive(r.active());
        return users.save(u);
    }

    /** Đặt lại mật khẩu cho nhân viên quên mật khẩu (quản trị báo mật khẩu mới trực tiếp). */
    public void resetPassword(Long id, String newPassword) {
        StaffUser u = find(id);
        u.setPasswordHash(passwords.encode(newPassword));
        users.save(u);
    }

    private StaffUser find(Long id) {
        return users.findById(id).orElseThrow(() -> AppException.notFound("Không tìm thấy tài khoản"));
    }
}
