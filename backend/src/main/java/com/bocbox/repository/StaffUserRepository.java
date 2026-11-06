package com.bocbox.repository;

import com.bocbox.entity.StaffUser;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface StaffUserRepository extends MongoRepository<StaffUser, Long> {
    Optional<StaffUser> findByUsername(String username);
}
