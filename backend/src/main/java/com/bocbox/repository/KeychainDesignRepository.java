package com.bocbox.repository;

import com.bocbox.entity.KeychainDesign;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface KeychainDesignRepository extends MongoRepository<KeychainDesign, Long> {
}
