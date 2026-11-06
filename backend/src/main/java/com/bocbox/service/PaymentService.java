package com.bocbox.service;

import com.bocbox.config.BocboxProperties;
import com.bocbox.dto.response.PaymentQrResponse;
import com.bocbox.entity.CustomerOrder;
import com.bocbox.entity.enums.OrderStatus;
import com.bocbox.exception.AppException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/** Thông tin chuyển khoản + ảnh mã VietQR (dịch vụ img.vietqr.io). Nội dung chuyển khoản = mã đơn; nhóm đối soát tay. */
@Service
public class PaymentService {
    private final BocboxProperties.Payment bank;

    public PaymentService(BocboxProperties props) { this.bank = props.payment(); }

    /** Chỉ có mã khi quản trị đã duyệt đơn và khách chưa trả tiền. */
    public PaymentQrResponse qrFor(CustomerOrder o) {
        if (o.getStatus() != OrderStatus.PENDING_PAYMENT) throw AppException.conflict("Đơn chưa được duyệt hoặc đã thanh toán");
        String url = "https://img.vietqr.io/image/" + bank.bankId() + "-" + bank.accountNo() + "-compact2.png?amount=" + o.getPrice()
                + "&addInfo=" + enc(o.getCode()) + "&accountName=" + enc(bank.accountName());
        return new PaymentQrResponse(o.getCode(), BigDecimal.valueOf(o.getPrice()), bank.bankId(), bank.accountNo(), bank.accountName(), o.getCode(), url);
    }

    private static String enc(String s) { return URLEncoder.encode(s, StandardCharsets.UTF_8); }
}
