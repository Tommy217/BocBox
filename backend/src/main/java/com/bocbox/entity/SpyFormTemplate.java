package com.bocbox.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/** Mẫu Google Form ngụy trang. googleFormCopyUrl = link form của nhóm (.../viewform); null = chưa có form. */
@Document(collection = "spy_form_templates")
public class SpyFormTemplate implements SequencedEntity {
    @Id
    private Long id;
    private String title;
    private String scenario;
    private String googleFormCopyUrl;
    private String confessionText;

    @Override public Long getId() { return id; }
    @Override public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getScenario() { return scenario; }
    public void setScenario(String scenario) { this.scenario = scenario; }
    public String getGoogleFormCopyUrl() { return googleFormCopyUrl; }
    public void setGoogleFormCopyUrl(String googleFormCopyUrl) { this.googleFormCopyUrl = googleFormCopyUrl; }
    public String getConfessionText() { return confessionText; }
    public void setConfessionText(String confessionText) { this.confessionText = confessionText; }
}
