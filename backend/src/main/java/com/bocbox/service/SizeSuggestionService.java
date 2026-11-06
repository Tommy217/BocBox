package com.bocbox.service;

import com.bocbox.dto.response.SizeSuggestionResponse;
import com.bocbox.entity.SizeChart;
import org.springframework.stereotype.Service;

import java.util.List;

/** Gợi ý size áo (form unisex rộng) từ chiều cao, cân nặng "tình báo" được của người nhận. */
@Service
public class SizeSuggestionService {
    private final CatalogService catalog;

    public SizeSuggestionService(CatalogService catalog) { this.catalog = catalog; }

    public SizeSuggestionResponse suggest(int heightCm, int weightKg, String usualSize) {
        List<SizeChart> all = catalog.sizes();
        for (SizeChart s : all) {
            if (heightCm <= s.getMaxHeight() && weightKg <= s.getMaxWeight()) {
                String reason = "Cao " + heightCm + " cm, nặng " + weightKg + " kg → size " + s.getCode() + " form rộng";
                if (usualSize != null && !usualSize.isBlank() && !usualSize.equalsIgnoreCase(s.getCode()))
                    reason += " (người nhận hay mặc " + usualSize + ", form rộng nên chọn theo bảng là an toàn)";
                return new SizeSuggestionResponse(s.getCode(), reason);
            }
        }
        SizeChart last = all.get(all.size() - 1);
        return new SizeSuggestionResponse(last.getCode(), "Vượt bảng size, chọn size lớn nhất " + last.getCode());
    }
}
