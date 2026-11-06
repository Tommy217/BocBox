package com.bocbox.config;

import com.bocbox.entity.SequencedEntity;
import org.bson.Document;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertCallback;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

/**
 * Cấp id số tăng dần cho document mới (giống IDENTITY của SQL cũ), để API vẫn trả id dạng số.
 * Mỗi collection một bộ đếm trong "counters": { _id: "orders", seq: 55 }. Script dữ liệu đặt sẵn seq = id lớn nhất.
 */
@Component
public class IdSequenceCallback implements BeforeConvertCallback<SequencedEntity> {
    public static final String COUNTERS = "counters";
    /** Lấy MongoOperations lúc cần (tránh vòng phụ thuộc: MongoTemplate cần callback, callback cần MongoTemplate). */
    private final ObjectProvider<MongoOperations> mongo;

    public IdSequenceCallback(ObjectProvider<MongoOperations> mongo) { this.mongo = mongo; }

    @Override
    public SequencedEntity onBeforeConvert(SequencedEntity entity, String collection) {
        if (entity.getId() == null) entity.setId(next(collection));
        return entity;
    }

    private long next(String collection) {
        Document counter = mongo.getObject().findAndModify(
                Query.query(Criteria.where("_id").is(collection)),
                new Update().inc("seq", 1L),
                FindAndModifyOptions.options().returnNew(true).upsert(true),
                Document.class, COUNTERS);
        return ((Number) counter.get("seq")).longValue();
    }
}
