package com.bocbox.dto.request;

/** Duyệt nội dung đơn: approve = true nhận đơn, false = cần sửa (note bắt buộc). */
public record ReviewRequest(boolean approve, String note) {}
