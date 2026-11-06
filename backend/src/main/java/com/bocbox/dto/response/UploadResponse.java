package com.bocbox.dto.response;

/** Ảnh vừa tải lên: slug "u:{uuid}" để đặt lên áo, url để hiển thị. */
public record UploadResponse(String slug, String url, String contentType, int sizeBytes) {}
