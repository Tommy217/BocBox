package com.bocbox.dto.response;

import java.time.LocalDateTime;

public record BatchStatResponse(String code, String status, LocalDateTime openAt, int orders, int paid, long revenue) {}
