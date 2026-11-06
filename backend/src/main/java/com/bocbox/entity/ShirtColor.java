package com.bocbox.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** Màu áo đang bán. */
@Document(collection = "shirt_colors")
public class ShirtColor implements SequencedEntity {
    @Id
    private Long id;
    private String name;
    private String hex;
    private boolean active = true;

    @Override public Long getId() { return id; }
    @Override public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getHex() { return hex; }
    public void setHex(String hex) { this.hex = hex; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
