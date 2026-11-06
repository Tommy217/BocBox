package com.bocbox.service;

import com.bocbox.entity.CustomImage;
import com.bocbox.entity.Customer;
import com.bocbox.exception.AppException;
import com.bocbox.repository.CustomImageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

/** Ảnh khách tự tải lên để in áo: nhận PNG / JPEG / WEBP tối đa 3 MB, lưu trong DB, trả slug "u:{uuid}". */
@Service
public class ImageService {
    public static final long MAX_BYTES = 3 * 1024 * 1024;
    private final CustomImageRepository images;

    public ImageService(CustomImageRepository images) { this.images = images; }

    @Transactional
    public CustomImage upload(Customer owner, MultipartFile file) {
        if (file == null || file.isEmpty()) throw AppException.invalid("File rỗng");
        if (file.getSize() > MAX_BYTES) throw AppException.tooLarge("Ảnh tối đa 3 MB");
        byte[] data;
        try { data = file.getBytes(); }
        catch (IOException e) { throw AppException.invalid("Không đọc được file ảnh"); }
        String type = sniff(data);
        if (type == null) throw AppException.unsupportedMedia("Chỉ nhận ảnh PNG, JPG hoặc WEBP");
        CustomImage img = new CustomImage();
        img.setUuid(UUID.randomUUID().toString());
        img.setCustomerId(owner.getId());
        img.setContentType(type);
        img.setSizeBytes(data.length);
        img.setData(data);
        img.setCreatedAt(LocalDateTime.now(BatchService.VN));
        return images.save(img);
    }

    @Transactional(readOnly = true)
    public CustomImage get(String uuid) {
        return images.findByUuid(uuid).orElseThrow(() -> AppException.notFound("Không tìm thấy ảnh"));
    }

    /** Nhận diện ảnh theo mấy byte đầu, không tin đuôi file hay Content-Type trình duyệt gửi. */
    static String sniff(byte[] b) {
        if (b.length > 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return "image/png";
        if (b.length > 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "image/jpeg";
        if (b.length > 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "image/webp";
        return null;
    }
}
