package com.bocbox.dto.response;

public record MemeResponse(Long id, String slug, String name, String tags, String screeningNote, String sourceUrl, String status, int popularity) {}
