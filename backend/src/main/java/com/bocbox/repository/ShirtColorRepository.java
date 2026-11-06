package com.bocbox.repository;

import com.bocbox.entity.ShirtColor;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ShirtColorRepository extends MongoRepository<ShirtColor, Long> {
}
