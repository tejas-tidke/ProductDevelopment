package com.htc.productdevelopment.repository;

import com.htc.productdevelopment.model.JiraProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface JiraProjectRepository extends JpaRepository<JiraProject, Long> {
    Optional<JiraProject> findByProjectId(String projectId);
    Optional<JiraProject> findByKey(String key);
    boolean existsByProjectId(String projectId);
    boolean existsByKey(String key);
}