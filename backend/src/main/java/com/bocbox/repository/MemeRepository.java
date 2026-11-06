package com.bocbox.repository;

import com.bocbox.entity.Meme;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface MemeRepository extends MongoRepository<Meme, Long> {
    Optional<Meme> findBySlug(String slug);
}
