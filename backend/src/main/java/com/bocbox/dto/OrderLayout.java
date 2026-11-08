package com.bocbox.dto;

import java.util.List;

/** Nội dung cột layoutJson của đơn: các lớp meme/ảnh và khối chữ, tọa độ theo tỉ lệ vùng in A3 (0..1). */
public record OrderLayout(List<Layer> layers, TextBlock text) {
    public record Layer(String slug, double x, double y, double w) {}
    public record TextBlock(double x, double y, double s) {}
}
