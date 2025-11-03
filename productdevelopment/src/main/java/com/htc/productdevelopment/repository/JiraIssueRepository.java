package com.htc.productdevelopment.repository;

import com.htc.productdevelopment.model.JiraIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JiraIssueRepository extends JpaRepository<JiraIssue, Long> {
    Optional<JiraIssue> findByKey(String key);
    Optional<JiraIssue> findByIssueId(String issueId);
    List<JiraIssue> findByProjectKey(String projectKey);
    List<JiraIssue> findByReporter(String reporter);
    List<JiraIssue> findByAssignee(String assignee);
    List<JiraIssue> findByStatus(String status);
}