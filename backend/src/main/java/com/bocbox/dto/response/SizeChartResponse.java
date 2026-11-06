package com.bocbox.dto.response;

public record SizeChartResponse(Long id, String code, int minHeight, int maxHeight, int minWeight, int maxWeight, int sortOrder) {}
