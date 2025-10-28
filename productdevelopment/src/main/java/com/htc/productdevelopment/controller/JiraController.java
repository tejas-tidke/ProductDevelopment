package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.model.JiraProject;
import com.htc.productdevelopment.service.JiraService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    /**
     * Get a specific Jira project by ID or key
     * @param projectIdOrKey The project ID or key
     * @return The Jira project details
     */
    @GetMapping("/projects/{projectIdOrKey}")
    public ResponseEntity<?> getProjectByIdOrKey(@PathVariable String projectIdOrKey) {
        try {
            log.info("Fetching Jira project with ID/Key: {}", projectIdOrKey);
            JiraProject project = jiraService.getProjectByIdOrKey(projectIdOrKey);
            return ResponseEntity.ok(project);
        } catch (Exception e) {
            log.error("Error fetching Jira project with ID/Key: {}", projectIdOrKey, e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch project: " + e.getMessage()));
        }
    }

    /**
     * Create a new Jira project
     * @param projectData The project data to create
     * @return The created project
     */
    @PostMapping("/projects")
    public ResponseEntity<?> createProject(@RequestBody Map<String, Object> projectData) {
        try {
            log.info("Creating new Jira project with data: {}", projectData);
            Object createdProject = jiraService.createProject(projectData);
            return ResponseEntity.ok(createdProject);
        } catch (Exception e) {
            log.error("Error creating Jira project", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to create project: " + e.getMessage()));
        }
    }
}