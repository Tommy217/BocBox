package com.bocbox.repository;

import com.bocbox.entity.CustomImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CustomImageRepository extends JpaRepository<CustomImage, Long> {
    Optional<CustomImage> findByUuid(String uuid);
}
