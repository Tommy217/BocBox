package com.bocbox.entity;

import jakarta.persistence.*;

/** Mẫu Google Form ngụy trang. googleFormCopyUrl = link form của nhóm (.../viewform); null = chưa có form. */
@Entity
@Table(name = "spy_form_templates")
public class SpyFormTemplate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 150)
    private String title;
    @Column(length = 500)
    private String scenario;
    @Column(length = 500)
    private String googleFormCopyUrl;
    @Column(length = 300)
    private String confessionText;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getScenario() { return scenario; }
    public void setScenario(String scenario) { this.scenario = scenario; }
    public String getGoogleFormCopyUrl() { return googleFormCopyUrl; }
    public void setGoogleFormCopyUrl(String googleFormCopyUrl) { this.googleFormCopyUrl = googleFormCopyUrl; }
    public String getConfessionText() { return confessionText; }
    public void setConfessionText(String confessionText) { this.confessionText = confessionText; }
}
