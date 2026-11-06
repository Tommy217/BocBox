package com.bocbox.controller;

import com.bocbox.entity.CustomImage;
import com.bocbox.service.ImageService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

/**
 * Trả ảnh khách đã tải lên (mã uuid ngẫu nhiên, không đoán được). Mở công khai để trang khách, trang quản trị
 * và canvas xuất file in đều tải được; CORS cho /api/** nên canvas không bị "tainted" khi xuất PNG.
 */
@RestController
public class UploadController {
    public static final String PATH = "/api/v1/uploads/";
    private final ImageService images;

    public UploadController(ImageService images) { this.images = images; }

    @GetMapping(PATH + "{uuid}")
    public ResponseEntity<byte[]> get(@PathVariable String uuid) {
        CustomImage img = images.get(uuid);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(img.getContentType()))
                .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                .body(img.getData());
    }
}
