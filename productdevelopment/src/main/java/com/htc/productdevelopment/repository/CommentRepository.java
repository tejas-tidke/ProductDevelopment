package com.htc.productdevelopment.repository;

import com.htc.productdevelopment.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    // We use this in the service to build the hierarchy
    List<Comment> findByIssueKeyOrderByCreatedAtAsc(String issueKey);

}

