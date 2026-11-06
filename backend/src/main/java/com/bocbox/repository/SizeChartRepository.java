package com.bocbox.repository;

import com.bocbox.entity.SizeChart;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SizeChartRepository extends MongoRepository<SizeChart, Long> {
}
