package com.bocbox.service;

import org.springframework.stereotype.Component;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

/**
 * Lọc thô từ cấm trước khi đưa vào hàng chờ duyệt tay. Danh sách mẫu, nhóm tự bổ sung.
 * So khớp giữ nguyên dấu: bỏ dấu thì "ngủ" thành "ngu", "lớn" thành "lon" và bị gắn cờ nhầm.
 */
@Component
public class ContentFilter {
    private static final List<String> BANNED = List.of("ngu", "đm", "dm", "đcm", "dcm", "vcl", "vl", "cc", "địt", "dit", "lồn", "cứt", "đéo", "deo");

    public boolean isSuspicious(String... texts) {
        for (String t : texts) {
            if (t == null || t.isBlank()) continue;
            String norm = Normalizer.normalize(t.toLowerCase(Locale.ROOT), Normalizer.Form.NFC);
            for (String word : norm.split("[^\\p{L}\\p{N}]+")) {
                if (BANNED.contains(word)) return true;
            }
        }
        return false;
    }
}
