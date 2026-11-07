package com.bocbox.controller;

import com.bocbox.dto.request.SizeSuggestionRequest;
import com.bocbox.dto.response.*;
import com.bocbox.mapper.CatalogMapper;
import com.bocbox.mapper.OrderMapper;
import com.bocbox.service.BatchService;
import com.bocbox.service.CatalogService;
import com.bocbox.service.PriceCalculator;
import com.bocbox.service.SizeSuggestionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** API công khai cho khách vãng lai: danh mục meme, màu, size, form ngụy trang, khô gấu, đợt đang mở, bảng giá, gợi ý size. */
@RestController
@RequestMapping("/api/v1")
public class PublicController {
    private final CatalogService catalog;
    private final BatchService batches;
    private final SizeSuggestionService sizeSuggestion;
    private final PriceCalculator prices;

    public PublicController(CatalogService catalog, BatchService batches, SizeSuggestionService sizeSuggestion, PriceCalculator prices) {
        this.catalog = catalog; this.batches = batches; this.sizeSuggestion = sizeSuggestion; this.prices = prices;
    }

    /** Bảng giá box (275–299k tùy số meme trên áo và kiểu thiệp). */
    @GetMapping("/pricing")
    public PricingResponse pricing() {
        var p = prices.pricing();
        return new PricingResponse(p.base(), p.extraMemes(), p.memeCard(), p.max());
    }

    @GetMapping("/memes")
    public List<MemeResponse> memes() { return catalog.approvedMemes().stream().map(CatalogMapper::toResponse).toList(); }

    @GetMapping("/shirt-colors")
    public List<ShirtColorResponse> colors() { return catalog.activeColors().stream().map(CatalogMapper::toResponse).toList(); }

    @GetMapping("/sizes")
    public List<SizeChartResponse> sizes() { return catalog.sizes().stream().map(CatalogMapper::toResponse).toList(); }

    @GetMapping("/spy-forms")
    public List<SpyFormResponse> spyForms() { return catalog.spyForms().stream().map(CatalogMapper::toResponse).toList(); }

    /** Công bố đủ các mẫu khô gấu trong series dạng "slug|tên" (không lộ tồn kho). */
    @GetMapping("/keychain-series/current")
    public List<String> keychainSeries() { return catalog.keychains().stream().map(k -> k.getSlug() + "|" + k.getName()).toList(); }

    @PostMapping("/size-suggestions")
    public SizeSuggestionResponse suggestSize(@Valid @RequestBody SizeSuggestionRequest r) {
        return sizeSuggestion.suggest(r.heightCm(), r.weightKg(), r.usualSize());
    }

    @GetMapping("/batches/open")
    public BatchResponse openBatch() { return OrderMapper.toResponse(batches.currentOpenBatch()); }
}
