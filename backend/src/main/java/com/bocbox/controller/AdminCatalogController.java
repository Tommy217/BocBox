package com.bocbox.controller;

import com.bocbox.dto.request.MemeStatusRequest;
import com.bocbox.dto.request.StockRequest;
import com.bocbox.dto.response.KeychainResponse;
import com.bocbox.dto.response.MemeResponse;
import com.bocbox.mapper.CatalogMapper;
import com.bocbox.service.CatalogService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Quản trị danh mục: kho khô gấu (STAFF), thư viện meme (xem: STAFF, ẩn/hiện: ADMIN). */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminCatalogController {
    private final CatalogService catalog;

    public AdminCatalogController(CatalogService catalog) { this.catalog = catalog; }

    @GetMapping("/keychains")
    public List<KeychainResponse> keychains() { return catalog.keychains().stream().map(CatalogMapper::toResponse).toList(); }

    @PatchMapping("/keychains/{id}")
    public KeychainResponse setStock(@PathVariable Long id, @Valid @RequestBody StockRequest r) {
        return CatalogMapper.toResponse(catalog.setStock(id, r.stockQty()));
    }

    /** Toàn bộ meme kể cả đã ẩn (trang khách chỉ thấy meme APPROVED). */
    @GetMapping("/memes")
    public List<MemeResponse> memes() { return catalog.allMemes().stream().map(CatalogMapper::toResponse).toList(); }

    @PatchMapping("/memes/{id}")
    public MemeResponse setMemeStatus(@PathVariable Long id, @Valid @RequestBody MemeStatusRequest r) {
        return CatalogMapper.toResponse(catalog.setMemeStatus(id, r.status()));
    }
}
