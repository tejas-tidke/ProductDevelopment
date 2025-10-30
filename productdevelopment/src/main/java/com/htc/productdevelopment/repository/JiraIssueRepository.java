package com.htc.productdevelopment.repository;

import com.htc.productdevelopment.model.JiraIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface JiraIssueRepository extends JpaRepository<JiraIssue, Long> {
    Optional<JiraIssue> findByIssueId(String issueId);
    Optional<JiraIssue> findByKey(String key);
    List<JiraIssue> findByProjectKey(String projectKey);
    boolean existsByIssueId(String issueId);
    boolean existsByKey(String key);
}