package com.bocbox.dto.request;

import jakarta.validation.constraints.*;

public record UpdateProfileRequest(@NotBlank @Size(max = 100) String fullName, @Email @Size(max = 120) String email) {}
