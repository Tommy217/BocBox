package com.bocbox.controller;

import com.bocbox.dto.response.ReportResponse;
import com.bocbox.service.ReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Báo cáo doanh thu (chỉ ADMIN, xem SecurityConfig). */
@RestController
@RequestMapping("/api/v1/admin/reports")
public class AdminReportController {
    private final ReportService reports;

    public AdminReportController(ReportService reports) { this.reports = reports; }

    @GetMapping("/summary")
    public ReportResponse summary() { return reports.report(); }
}
