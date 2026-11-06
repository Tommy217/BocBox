package com.bocbox.entity;

import jakarta.persistence.*;
import com.bocbox.entity.enums.MemeStatus;

/** Meme in lên áo; ảnh nằm ở frontend/public/memes/{slug}.jpg. */
@Entity
@Table(name = "memes")
public class Meme {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 50)
    private String slug;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(length = 200)
    private String tags;
    @Column(length = 300)
    private String screeningNote;
    /** Link nguồn tham khảo (Know Your Meme, Imgflip...); null nếu nhóm tự sáng tác. */
    @Column(length = 300)
    private String sourceUrl;
    @Enumerated(EnumType.STRING) @Column(length = 20)
    private MemeStatus status = MemeStatus.APPROVED;
    private int popularity;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
