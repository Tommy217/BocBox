package com.bocbox.dto.request;

import jakarta.validation.constraints.*;
import com.bocbox.entity.enums.MemeStatus;

public record MemeStatusRequest(@NotNull MemeStatus status) {}
