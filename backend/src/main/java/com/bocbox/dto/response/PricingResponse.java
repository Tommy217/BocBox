package com.bocbox.dto.response;

/** Bảng giá công khai cho trang bán hàng: giá gốc, phụ thu nhiều meme, phụ thu thiệp meme, giá tối đa. */
public record PricingResponse(long base, long extraMemes, long memeCard, long max) {}
