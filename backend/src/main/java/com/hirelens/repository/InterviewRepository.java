package com.hirelens.repository;

import com.hirelens.model.Interview;
import com.hirelens.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findByUserOrderByCreatedAtDesc(User user);
    List<Interview> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserId(Long userId);
}
