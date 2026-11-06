package com.bocbox.service;

import com.bocbox.dto.request.ChangePasswordRequest;
import com.bocbox.dto.request.CustomerRegisterRequest;
import com.bocbox.dto.request.UpdateProfileRequest;
import com.bocbox.entity.Customer;
import com.bocbox.exception.AppException;
import com.bocbox.repository.CustomerRepository;
import com.bocbox.security.JwtTokenService;
import com.bocbox.security.LoginThrottle;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/** Tài khoản khách: đăng ký / đăng nhập bằng số điện thoại + mật khẩu, hồ sơ, đổi mật khẩu. */
@Service
public class CustomerAccountService {
    private final CustomerRepository customers;
    private final PasswordEncoder passwords;
    private final LoginThrottle throttle;
    /** Băm sẵn để khi sai SĐT vẫn tốn thời gian như sai mật khẩu (không dò được SĐT nào có tài khoản). */
    private final String dummyHash;

    public CustomerAccountService(CustomerRepository customers, PasswordEncoder passwords, LoginThrottle throttle) {
        this.customers = customers; this.passwords = passwords; this.throttle = throttle;
        this.dummyHash = passwords.encode("bocbox-dummy");
    }

    public Customer register(CustomerRegisterRequest r) {
        String phone = r.phone().trim();
        if (customers.existsByPhone(phone)) throw AppException.conflict("Số điện thoại này đã có tài khoản, hãy đăng nhập");
        Customer c = new Customer();
        c.setPhone(phone);
        c.setPasswordHash(passwords.encode(r.password()));
        c.setFullName(r.fullName().trim());
        c.setEmail(blankToNull(r.email()));
        LocalDateTime now = LocalDateTime.now(BatchService.VN);
        c.setCreatedAt(now); c.setLastLoginAt(now);
        return customers.save(c);
    }

    public Customer login(String rawPhone, String password, String clientIp) {
        String phone = rawPhone.replaceAll("\\s", "");
        String[] keys = { "c:" + phone, "ip:" + clientIp };
        long locked = throttle.lockedMinutes(keys);
        if (locked > 0) throw AppException.tooManyRequests("Sai mật khẩu quá nhiều lần, thử lại sau " + locked + " phút");
        Customer c = customers.findByPhone(phone).filter(Customer::isActive).orElse(null);
        boolean ok = passwords.matches(password, c == null ? dummyHash : c.getPasswordHash());
        if (c == null || !ok) {
            throttle.failed(keys);
            throw AppException.unauthorized("Sai số điện thoại hoặc mật khẩu");
        }
        throttle.succeeded(keys);
        c.setLastLoginAt(LocalDateTime.now(BatchService.VN));
        return customers.save(c);
    }

    /** Tài khoản khách của token đang gọi API (đã kiểm tra còn hoạt động). */
    public Customer current(Jwt t) {
        Long id = JwtTokenService.customerId(t).orElseThrow(() -> AppException.unauthorized("Cần đăng nhập tài khoản khách"));
        return customers.findById(id).filter(Customer::isActive)
                .orElseThrow(() -> AppException.unauthorized("Tài khoản không còn hoạt động"));
    }

    public Customer updateProfile(Jwt t, UpdateProfileRequest r) {
        Customer c = current(t);
        c.setFullName(r.fullName().trim());
        c.setEmail(blankToNull(r.email()));
        return customers.save(c);
    }

    public void changePassword(Jwt t, ChangePasswordRequest r) {
        Customer c = current(t);
        if (!passwords.matches(r.currentPassword(), c.getPasswordHash())) throw AppException.invalid("Mật khẩu hiện tại không đúng");
        c.setPasswordHash(passwords.encode(r.newPassword()));
        customers.save(c);
    }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }
}
