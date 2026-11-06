package com.bocbox.entity;

import jakarta.persistence.*;

/** Màu áo đang bán. */
@Entity
@Table(name = "shirt_colors")
public class ShirtColor {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 50)
    private String name;
    @Column(nullable = false, length = 7)
    private String hex;
    private boolean active = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getHex() { return hex; }
    public void setHex(String hex) { this.hex = hex; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
