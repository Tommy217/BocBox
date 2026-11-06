package com.bocbox.mapper;

import com.bocbox.dto.response.*;
import com.bocbox.entity.*;

/** Đổi entity danh mục (meme, màu, size, form ngụy trang, khô gấu) sang dữ liệu trả về API. */
public final class CatalogMapper {
    private CatalogMapper() {}

    public static MemeResponse toResponse(Meme m) {
        return new MemeResponse(m.getId(), m.getSlug(), m.getName(), m.getTags(), m.getScreeningNote(), m.getSourceUrl(),
                m.getStatus().name(), m.getPopularity());
    }

    public static ShirtColorResponse toResponse(ShirtColor c) {
        return new ShirtColorResponse(c.getId(), c.getName(), c.getHex(), c.isActive());
    }

    public static SizeChartResponse toResponse(SizeChart s) {
        return new SizeChartResponse(s.getId(), s.getCode(), s.getMinHeight(), s.getMaxHeight(), s.getMinWeight(), s.getMaxWeight(), s.getSortOrder());
    }

    public static SpyFormResponse toResponse(SpyFormTemplate t) {
        return new SpyFormResponse(t.getId(), t.getTitle(), t.getScenario(), t.getGoogleFormCopyUrl(), t.getConfessionText());
    }

    public static KeychainResponse toResponse(KeychainDesign k) {
        return new KeychainResponse(k.getId(), k.getSeriesName(), k.getName(), k.getSlug(), k.getStockQty());
    }
}
