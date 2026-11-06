package com.bocbox.repository;

import com.bocbox.entity.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    Optional<CustomerOrder> findByCode(String code);
    List<CustomerOrder> findByBatchIdOrderByCreatedAtAsc(Long batchId);
    List<CustomerOrder> findAllByOrderByCreatedAtDesc();
    List<CustomerOrder> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    boolean existsByCode(String code);
}
