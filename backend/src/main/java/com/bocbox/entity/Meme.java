package com.bocbox.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.bocbox.entity.enums.MemeStatus;

/** Meme in lên áo; ảnh nằm ở frontend/public/memes/{slug}.jpg. */
@Document(collection = "memes")
public class Meme implements SequencedEntity {
    @Id
    private Long id;
    private String slug;
    private String name;
    private String tags;
    private String screeningNote;
    /** Link nguồn tham khảo (Imgflip...); null nếu nhóm tự sáng tác. */
    private String sourceUrl;
    private MemeStatus status = MemeStatus.APPROVED;
    private int popularity;

    @Override public Long getId() { return id; }
    @Override public void setId(Long id) { this.id = id; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getScreeningNote() { return screeningNote; }
    public void setScreeningNote(String screeningNote) { this.screeningNote = screeningNote; }
    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
    public MemeStatus getStatus() { return status; }
    public void setStatus(MemeStatus status) { this.status = status; }
    public int getPopularity() { return popularity; }
    public void setPopularity(int popularity) { this.popularity = popularity; }
}
