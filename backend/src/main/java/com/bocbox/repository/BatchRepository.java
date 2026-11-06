package com.bocbox.repository;

import com.bocbox.entity.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import com.bocbox.entity.enums.BatchStatus;
import java.util.List;
import java.util.Optional;

public interface BatchRepository extends JpaRepository<Batch, Long> {
    Optional<Batch> findFirstByStatusOrderByOpenAtDesc(BatchStatus status);
    List<Batch> findAllByOrderByOpenAtDesc();
    boolean existsByCode(String code);
}
