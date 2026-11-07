package com.bocbox.repository;

import com.bocbox.entity.SavedDesign;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface SavedDesignRepository extends MongoRepository<SavedDesign, Long> {
    List<SavedDesign> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    long countByCustomerId(Long customerId);
    Optional<SavedDesign> findByIdAndCustomerId(Long id, Long customerId);
}
