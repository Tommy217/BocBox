package com.bocbox.dto.request;

import jakarta.validation.constraints.*;

public record StockRequest(@Min(0) @Max(9999) int stockQty) {}
