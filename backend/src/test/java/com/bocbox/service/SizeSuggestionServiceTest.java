package com.bocbox.service;

import com.bocbox.dto.response.SizeSuggestionResponse;
import com.bocbox.entity.SizeChart;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SizeSuggestionServiceTest {

    private static SizeChart size(String code, int maxH, int maxW, int order) {
        SizeChart s = new SizeChart();
        s.setCode(code); s.setMaxHeight(maxH); s.setMaxWeight(maxW); s.setSortOrder(order);
        return s;
    }

    /** Bảng size giống dữ liệu trong sql/bocbox-full.sql, không cần DB. */
    private final SizeSuggestionService service = new SizeSuggestionService(new CatalogService(null, null, null, null, null) {
        @Override
        public List<SizeChart> sizes() {
            return List.of(size("S", 160, 50, 1), size("M", 168, 60, 2), size("L", 175, 70, 3), size("XL", 182, 82, 4), size("XXL", 220, 150, 5));
        }
    });

    @Test
    void goiYTheoChieuCaoVaCanNang() {
        assertEquals("M", service.suggest(165, 55, "").sizeCode());
        assertEquals("L", service.suggest(165, 65, null).sizeCode()); // nặng hơn mốc M thì lên L
    }

    @Test
    void ghiChuKhiKhacSizeHayMac() {
        SizeSuggestionResponse r = service.suggest(165, 55, "S");
        assertTrue(r.reason().contains("hay mặc S"));
    }

    @Test
    void vuotBangThiChonSizeLonNhat() {
        assertEquals("XXL", service.suggest(220, 150, null).sizeCode());
    }
}
