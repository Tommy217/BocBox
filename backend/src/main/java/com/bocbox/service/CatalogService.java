package com.bocbox.service;

import com.bocbox.entity.*;
import com.bocbox.entity.enums.MemeStatus;
import com.bocbox.exception.AppException;
import com.bocbox.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/** Danh mục bán hàng: meme, màu áo, bảng size, form ngụy trang, khô gấu (kể cả phần quản trị kho / thư viện meme). */
@Service
@Transactional(readOnly = true)
public class CatalogService {
    private final MemeRepository memes;
    private final ShirtColorRepository colors;
    private final SizeChartRepository sizes;
    private final SpyFormTemplateRepository spyForms;
    private final KeychainDesignRepository keychains;

    public CatalogService(MemeRepository memes, ShirtColorRepository colors, SizeChartRepository sizes,
                          SpyFormTemplateRepository spyForms, KeychainDesignRepository keychains) {
        this.memes = memes; this.colors = colors; this.sizes = sizes; this.spyForms = spyForms; this.keychains = keychains;
    }

    private static final Comparator<Meme> MOST_POPULAR = Comparator.comparingInt((Meme m) -> -m.getPopularity());

    /** Meme khách thấy ở Xưởng in: chỉ APPROVED, phổ biến nhất trước. */
    public List<Meme> approvedMemes() {
        return memes.findAll().stream().filter(m -> m.getStatus() == MemeStatus.APPROVED).sorted(MOST_POPULAR).toList();
    }

    /** Toàn bộ meme kể cả đã ẩn (trang quản trị). */
    public List<Meme> allMemes() { return memes.findAll().stream().sorted(MOST_POPULAR).toList(); }

    /** ADMIN ẩn (REJECTED) hoặc hiện lại (APPROVED) một meme. Đơn cũ đã dùng meme đó không bị ảnh hưởng. */
    @Transactional
    public Meme setMemeStatus(Long id, MemeStatus status) {
        Meme m = memes.findById(id).orElseThrow(() -> AppException.notFound("Không tìm thấy meme"));
        m.setStatus(status);
        return memes.save(m);
    }

    public List<ShirtColor> activeColors() { return colors.findAll().stream().filter(ShirtColor::isActive).toList(); }

    public List<SizeChart> sizes() { return sizes.findAll().stream().sorted(Comparator.comparingInt(SizeChart::getSortOrder)).toList(); }

    public List<SpyFormTemplate> spyForms() { return spyForms.findAll(); }

    public List<KeychainDesign> keychains() { return keychains.findAll(); }

    /** Cập nhật tồn kho khô gấu sau khi nhập hàng hoặc kiểm kho. */
    @Transactional
    public KeychainDesign setStock(Long id, int stockQty) {
        KeychainDesign k = keychains.findById(id).orElseThrow(() -> AppException.notFound("Không tìm thấy mẫu khô gấu"));
        k.setStockQty(stockQty);
        return keychains.save(k);
    }
}
