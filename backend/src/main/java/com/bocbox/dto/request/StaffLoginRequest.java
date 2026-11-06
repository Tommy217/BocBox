package com.bocbox.dto.request;

import jakarta.validation.constraints.*;

public record StaffLoginRequest(@NotBlank @Size(max = 50) String username, @NotBlank @Size(max = 100) String password) {}
