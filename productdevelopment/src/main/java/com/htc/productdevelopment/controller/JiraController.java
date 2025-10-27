package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.model.JiraProject;
import com.htc.productdevelopment.service.JiraService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/jira")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class JiraController {

    private final JiraService jiraService;

    /**
     * Get recent Jira projects (max 3)
     * @return List of recent Jira projects
     */
    @GetMapping("/projects/recent")
    public ResponseEntity<List<JiraProject>> getRecentProjects() {
        try {
            List<JiraProject> projects = jiraService.getRecentProjects();
            return ResponseEntity.ok(projects);
        } catch (Exception e) {
            log.error("Error fetching recent Jira projects", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get all Jira projects
     * @return List of all Jira projects
     */
    @GetMapping("/projects")
    public ResponseEntity<List<JiraProject>> getAllProjects() {
        try {
            List<JiraProject> projects = jiraService.getAllProjects();
            return ResponseEntity.ok(projects);
        } catch (Exception e) {
            log.error("Error fetching all Jira projects", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}