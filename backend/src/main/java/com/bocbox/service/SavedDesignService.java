package com.bocbox.service;

import com.bocbox.dto.request.SaveDesignRequest;
import com.bocbox.entity.Customer;
import com.bocbox.entity.SavedDesign;
import com.bocbox.entity.ShirtColor;
import com.bocbox.exception.AppException;
import com.bocbox.repository.SavedDesignRepository;
import com.bocbox.repository.ShirtColorRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/** "Mẫu của tôi": khách lưu thiết kế áo ưng ý để lần sau mở lại trong Xưởng in. Mẫu lưu không cần duyệt, chỉ duyệt khi đặt đơn. */
@Service
public class SavedDesignService {
    /** Giới hạn số mẫu mỗi tài khoản cho nhẹ database. */
    public static final int MAX_PER_CUSTOMER = 20;

    private final SavedDesignRepository designs;
    private final ShirtColorRepository colors;
    private final LayoutValidator layouts;

    public SavedDesignService(SavedDesignRepository designs, ShirtColorRepository colors, LayoutValidator layouts) {
        this.designs = designs; this.colors = colors; this.layouts = layouts;
    }

    public List<SavedDesign> list(Customer c) { return designs.findByCustomerIdOrderByCreatedAtDesc(c.getId()); }

    public SavedDesign save(Customer c, SaveDesignRequest r) {
        if (designs.countByCustomerId(c.getId()) >= MAX_PER_CUSTOMER)
            throw AppException.conflict("Mẫu của tôi đã đủ " + MAX_PER_CUSTOMER + " mẫu, xóa bớt mẫu cũ rồi lưu tiếp nhé");
        LayoutValidator.Checked layout = layouts.check(r.layoutJson(), c.getId());
        String hex = colors.findAll().stream().filter(x -> x.isActive() && x.getHex().equalsIgnoreCase(r.colorHex())).map(ShirtColor::getHex)
                .findFirst().orElseThrow(() -> AppException.invalid("Màu áo không hợp lệ"));
        SavedDesign d = new SavedDesign();
        d.setCustomerId(c.getId());
        d.setName(r.name().trim());
        d.setMemeSlug(layout.firstSlug());
        d.setColorHex(hex);
        d.setTextLine1(blankToNull(r.textLine1()));
        d.setTextLine2(blankToNull(r.textLine2()));
        if (d.getMemeSlug() == null && d.getTextLine1() == null && d.getTextLine2() == null)
            throw AppException.invalid("Áo đang trống: thêm ít nhất một meme, ảnh hoặc dòng chữ rồi hãy lưu");
        d.setFont(r.font());
        d.setLayoutJson(layout.json());
        d.setCreatedAt(LocalDateTime.now(BatchService.VN));
        return designs.save(d);
    }

    public void delete(Customer c, Long id) {
        SavedDesign d = designs.findByIdAndCustomerId(id, c.getId()).orElseThrow(() -> AppException.notFound("Không tìm thấy mẫu này"));
        designs.delete(d);
    }

    private static String blankToNull(String s) { return s == null || s.isBlank() ? null : s.trim(); }
}
