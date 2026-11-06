package com.bocbox.dto.request;

import jakarta.validation.constraints.*;

public record SizeSuggestionRequest(@Min(120) @Max(220) int heightCm, @Min(30) @Max(150) int weightKg, String usualSize) {}
