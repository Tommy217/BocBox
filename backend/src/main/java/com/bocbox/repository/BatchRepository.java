package com.bocbox.repository;

import com.bocbox.entity.Batch;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.bocbox.entity.enums.BatchStatus;
import java.util.List;
import java.util.Optional;

public interface BatchRepository extends MongoRepository<Batch, Long> {
    Optional<Batch> findFirstByStatusOrderByOpenAtDesc(BatchStatus status);
    List<Batch> findAllByOrderByOpenAtDesc();
    boolean existsByCode(String code);
}
