package com.bocbox.mapper;

import com.bocbox.dto.response.OrderResponse;
import com.bocbox.entity.Batch;
import com.bocbox.entity.Customer;
import com.bocbox.entity.CustomerOrder;
import com.bocbox.repository.BatchRepository;
import com.bocbox.repository.CustomerRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Ghép đơn với đợt và tài khoản khách để trả API. MongoDB không JOIN được nên nạp gộp một lần
 * (2 truy vấn cho cả danh sách) thay vì mỗi đơn một truy vấn.
 */
@Component
public class OrderResponseAssembler {
    private final BatchRepository batches;
    private final CustomerRepository customers;

    public OrderResponseAssembler(BatchRepository batches, CustomerRepository customers) {
        this.batches = batches; this.customers = customers;
    }

    public OrderResponse one(CustomerOrder o) { return many(List.of(o)).get(0); }

    public List<OrderResponse> many(List<CustomerOrder> orders) {
        Map<Long, Batch> b = load(orders, CustomerOrder::getBatchId, batches::findAllById, Batch::getId);
        Map<Long, Customer> c = load(orders, CustomerOrder::getCustomerId, customers::findAllById, Customer::getId);
        return orders.stream().map(o -> OrderMapper.toResponse(o, b.get(o.getBatchId()), c.get(o.getCustomerId()))).toList();
    }

    private static <T> Map<Long, T> load(List<CustomerOrder> orders, Function<CustomerOrder, Long> idOf,
                                        Function<List<Long>, List<T>> findAll, Function<T, Long> keyOf) {
        List<Long> ids = orders.stream().map(idOf).filter(Objects::nonNull).distinct().toList();
        return ids.isEmpty() ? Map.of() : findAll.apply(ids).stream().collect(Collectors.toMap(keyOf, x -> x));
    }
}
