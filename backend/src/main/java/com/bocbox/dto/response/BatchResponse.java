package com.bocbox.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record BatchResponse(Long id, String code, LocalDateTime openAt, LocalDateTime closeAt,
                            LocalDate deliveryFrom, LocalDate deliveryTo, String status) {}
