package com.bocbox.service;

import com.bocbox.dto.OrderLayout;
import com.bocbox.dto.OrderLayout.Layer;
import com.bocbox.entity.CustomImage;
import com.bocbox.entity.Meme;
import com.bocbox.entity.enums.MemeStatus;
import com.bocbox.exception.AppException;
import com.bocbox.repository.CustomImageRepository;
import com.bocbox.repository.MemeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.List;

/** Kiểm tra bố cục áo (dùng chung cho đơn hàng và "Mẫu của tôi"): 0–4 lớp meme/ảnh, tọa độ trong vùng in. */
@Component
public class LayoutValidator {
    public static final int MAX_LAYERS = 4;

    private final MemeRepository memes;
    private final CustomImageRepository images;
    private final ObjectMapper mapper;

    public LayoutValidator(MemeRepository memes, CustomImageRepository images, ObjectMapper mapper) {
        this.memes = memes; this.images = images; this.mapper = mapper;
    }

    /** Bố cục đã kiểm tra và chuẩn hóa; json rỗng → null (áo chỉ có chữ, hoặc client cũ). */
    public record Checked(String json, List<Layer> layers) {
        public String firstSlug() { return layers.isEmpty() ? null : layers.get(0).slug(); }
    }

    public Checked check(String json, Long ownerId) {
        if (json == null || json.isBlank()) return new Checked(null, List.of());
        OrderLayout l;
        try { l = mapper.readValue(json, OrderLayout.class); }
        catch (Exception e) { throw AppException.invalid("Bố cục áo không hợp lệ"); }
        List<Layer> layers = l.layers() == null ? List.of() : l.layers();
        if (layers.size() > MAX_LAYERS) throw AppException.invalid("Áo tối đa " + MAX_LAYERS + " meme/ảnh");
        for (Layer x : layers) {
            checkLayerImage(x.slug(), ownerId);
            if (!in01(x.x()) || !in01(x.y()) || x.w() <= 0 || x.w() > 1) throw AppException.invalid("Meme nằm ngoài vùng in");
        }
        if (l.text() != null && (!in01(l.text().x()) || !in01(l.text().y()) || l.text().s() <= 0 || l.text().s() > 0.2))
            throw AppException.invalid("Chữ nằm ngoài vùng in");
        try { return new Checked(mapper.writeValueAsString(new OrderLayout(layers, l.text())), layers); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }

    public Meme approvedMeme(String slug) {
        return memes.findBySlug(slug).filter(m -> m.getStatus() == MemeStatus.APPROVED)
                .orElseThrow(() -> AppException.invalid("Meme không hợp lệ"));
    }

    /** Lớp ảnh khách tải lên ("u:{uuid}") phải thuộc chính tài khoản đó; lớp còn lại phải là meme đang bán. */
    private void checkLayerImage(String slug, Long ownerId) {
        if (CustomImage.isUploadSlug(slug)) {
            boolean ok = images.findByUuid(slug.substring(CustomImage.SLUG_PREFIX.length()))
                    .filter(i -> ownerId != null && ownerId.equals(i.getCustomerId())).isPresent();
            if (!ok) throw AppException.invalid("Ảnh tải lên không hợp lệ, hãy tải lại ảnh");
        } else approvedMeme(slug);
    }

    private static boolean in01(double v) { return v >= 0 && v <= 1; }
}
