package com.bocbox.controller;

import com.bocbox.dto.request.*;
import com.bocbox.dto.response.*;
import com.bocbox.entity.CustomImage;
import com.bocbox.entity.Customer;
import com.bocbox.mapper.AccountMapper;
import com.bocbox.mapper.DesignMapper;
import com.bocbox.mapper.OrderMapper;
import com.bocbox.mapper.OrderResponseAssembler;
import com.bocbox.security.JwtTokenService;
import com.bocbox.service.CustomerAccountService;
import com.bocbox.service.ImageService;
import com.bocbox.service.OrderService;
import com.bocbox.service.PaymentService;
import com.bocbox.service.SavedDesignService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Khu của khách: đăng ký / đăng nhập bằng SĐT + mật khẩu, "Đơn của tôi", "Mẫu của tôi", đặt / sửa / hủy đơn, mã VietQR, tải ảnh lên để in.
 * Khách vãng lai xem và thiết kế tự do; mọi API dưới /customer (trừ register, login) cần token ROLE_CUSTOMER.
 */
@RestController
@RequestMapping("/api/v1/customer")
public class CustomerController {
    private final CustomerAccountService accounts;
    private final OrderService orders;
    private final PaymentService payment;
    private final ImageService images;
    private final JwtTokenService tokens;
    private final SavedDesignService designs;

    private final OrderResponseAssembler assembler;

    public CustomerController(OrderResponseAssembler assembler, CustomerAccountService accounts, OrderService orders, PaymentService payment,
                              ImageService images, JwtTokenService tokens, SavedDesignService designs) {
        this.assembler = assembler;
        this.accounts = accounts; this.orders = orders; this.payment = payment; this.images = images; this.tokens = tokens; this.designs = designs;
    }

    // ---------- tài khoản ----------
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerLoginResponse register(@Valid @RequestBody CustomerRegisterRequest r) { return loginResponse(accounts.register(r)); }

    @PostMapping("/login")
    public CustomerLoginResponse login(@Valid @RequestBody CustomerLoginRequest r, HttpServletRequest req) {
        return loginResponse(accounts.login(r.phone(), r.password(), req.getRemoteAddr()));
    }

    @GetMapping("/me")
    public CustomerResponse me(@AuthenticationPrincipal Jwt t) { return AccountMapper.toResponse(accounts.current(t), t.getExpiresAt()); }

    @PutMapping("/me")
    public CustomerResponse updateMe(@AuthenticationPrincipal Jwt t, @Valid @RequestBody UpdateProfileRequest r) {
        return AccountMapper.toResponse(accounts.updateProfile(t, r), t.getExpiresAt());
    }

    @PostMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal Jwt t, @Valid @RequestBody ChangePasswordRequest r) { accounts.changePassword(t, r); }

    // ---------- đơn của tôi ----------
    @GetMapping("/orders")
    public List<OrderResponse> myOrders(@AuthenticationPrincipal Jwt t) {
        return assembler.many(orders.listForCustomer(accounts.current(t)));
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@AuthenticationPrincipal Jwt t, @Valid @RequestBody CreateOrderRequest r) {
        return assembler.one(orders.create(accounts.current(t), r));
    }

    @GetMapping("/orders/{code}")
    public OrderResponse get(@AuthenticationPrincipal Jwt t, @PathVariable String code) {
        return assembler.one(orders.getForCustomer(code, accounts.current(t)));
    }

    @PutMapping("/orders/{code}")
    public OrderResponse update(@AuthenticationPrincipal Jwt t, @PathVariable String code, @Valid @RequestBody CreateOrderRequest r) {
        return assembler.one(orders.update(code, accounts.current(t), r));
    }

    @PostMapping("/orders/{code}/cancel")
    public OrderResponse cancel(@AuthenticationPrincipal Jwt t, @PathVariable String code) {
        return assembler.one(orders.cancel(code, accounts.current(t)));
    }

    /** Mã VietQR chỉ có sau khi quản trị đã duyệt đơn (trạng thái chờ thanh toán). */
    @GetMapping("/orders/{code}/payment-qr")
    public PaymentQrResponse paymentQr(@AuthenticationPrincipal Jwt t, @PathVariable String code) {
        return payment.qrFor(orders.getForCustomer(code, accounts.current(t)));
    }

    // ---------- ảnh tải lên ----------
    /** Nhận PNG / JPEG / WEBP tối đa 3 MB (frontend đã thu nhỏ trước khi gửi). Trả slug "u:{uuid}" để đặt lên áo. */
    @PostMapping(value = "/uploads", consumes = "multipart/form-data")
    @ResponseStatus(HttpStatus.CREATED)
    public UploadResponse upload(@AuthenticationPrincipal Jwt t, @RequestParam("file") MultipartFile file) {
        CustomImage img = images.upload(accounts.current(t), file);
        return new UploadResponse(img.slug(), UploadController.PATH + img.getUuid(), img.getContentType(), img.getSizeBytes());
    }

    // ---------- mẫu của tôi ----------
    @GetMapping("/designs")
    public List<SavedDesignResponse> myDesigns(@AuthenticationPrincipal Jwt t) {
        return designs.list(accounts.current(t)).stream().map(DesignMapper::toResponse).toList();
    }

    @PostMapping("/designs")
    @ResponseStatus(HttpStatus.CREATED)
    public SavedDesignResponse saveDesign(@AuthenticationPrincipal Jwt t, @Valid @RequestBody SaveDesignRequest r) {
        return DesignMapper.toResponse(designs.save(accounts.current(t), r));
    }

    @DeleteMapping("/designs/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDesign(@AuthenticationPrincipal Jwt t, @PathVariable Long id) { designs.delete(accounts.current(t), id); }

    private CustomerLoginResponse loginResponse(Customer c) {
        JwtTokenService.IssuedToken t = tokens.issueFor(c);
        return new CustomerLoginResponse(t.value(), AccountMapper.toResponse(c, t.expiresAt()));
    }
}
