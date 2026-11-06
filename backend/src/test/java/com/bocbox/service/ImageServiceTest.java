package com.bocbox.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Ảnh tải lên được nhận diện theo byte đầu, không tin đuôi file. */
class ImageServiceTest {

    private static byte[] bytes(int... b) {
        byte[] out = new byte[16];
        for (int i = 0; i < b.length; i++) out[i] = (byte) b[i];
        return out;
    }

    @Test
    void nhanDungPngJpgWebp() {
        assertEquals("image/png", ImageService.sniff(bytes(0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A)));
        assertEquals("image/jpeg", ImageService.sniff(bytes(0xFF, 0xD8, 0xFF, 0xE0)));
        assertEquals("image/webp", ImageService.sniff(bytes('R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P')));
    }

    @Test
    void tuChoiFileKhac() {
        assertNull(ImageService.sniff(bytes('%', 'P', 'D', 'F')));
        assertNull(ImageService.sniff(new byte[2]));
    }
}
