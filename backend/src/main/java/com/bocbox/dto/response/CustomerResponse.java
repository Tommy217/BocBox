package com.bocbox.dto.response;

import java.time.Instant;

public record CustomerResponse(Long id, String phone, String fullName, String email, Instant expiresAt) {}
