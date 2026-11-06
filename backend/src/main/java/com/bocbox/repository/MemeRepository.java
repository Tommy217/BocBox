package com.bocbox.repository;

import com.bocbox.entity.Meme;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MemeRepository extends JpaRepository<Meme, Long> {
    Optional<Meme> findBySlug(String slug);
}
