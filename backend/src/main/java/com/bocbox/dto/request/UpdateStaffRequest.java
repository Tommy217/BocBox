package com.bocbox.dto.request;

import jakarta.validation.constraints.*;
import com.bocbox.entity.enums.StaffRole;

public record UpdateStaffRequest(@NotBlank @Size(max = 100) String displayName, @NotNull StaffRole role, boolean active) {}
