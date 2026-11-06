package com.bocbox.repository;

import com.bocbox.entity.CustomImage;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface CustomImageRepository extends MongoRepository<CustomImage, Long> {
    Optional<CustomImage> findByUuid(String uuid);
}
