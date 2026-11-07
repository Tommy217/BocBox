package com.bocbox.mapper;

import com.bocbox.dto.response.SavedDesignResponse;
import com.bocbox.entity.SavedDesign;

public final class DesignMapper {
    private DesignMapper() {}

    public static SavedDesignResponse toResponse(SavedDesign d) {
        return new SavedDesignResponse(d.getId(), d.getName(), d.getMemeSlug(), d.getColorHex(), d.getTextLine1(), d.getTextLine2(),
                d.getFont(), "CENTER", d.getLayoutJson(), d.getCreatedAt());
    }
}
