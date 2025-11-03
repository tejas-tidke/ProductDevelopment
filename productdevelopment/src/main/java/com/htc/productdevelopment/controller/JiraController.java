package com.htc.productdevelopment.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.htc.productdevelopment.model.JiraProject;
import com.htc.productdevelopment.service.JiraService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Controller class for handling Jira-related API requests
 * This controller provides endpoints for managing Jira projects and issues
 */
@RestController
@RequestMapping("/api/jira")
@CrossOrigin(origins = "http://localhost:5173")
public class JiraController {

    // Logger for tracking controller operations
    private static final Logger logger = LoggerFactory.getLogger(JiraController.class);
    
    // Service for handling Jira operations
    private final JiraService jiraService;

    /**
     * Constructor to initialize dependencies
     * @param jiraService Service for Jira operations
     */
    public JiraController(JiraService jiraService) {
        this.jiraService = jiraService;
    }

    /**
     * Get recent Jira projects (max 3)
     * @return List of recent Jira projects
     */
    @GetMapping("/projects/recent")
    public ResponseEntity<List<JiraProject>> getRecentProjects() {
        try {
            logger.info("Received request for recent Jira projects");
            List<JiraProject> projects = jiraService.getRecentProjects();
            logger.info("Returning {} recent projects", projects.size());
            return ResponseEntity.ok(projects);
        } catch (Exception e) {
            logger.error("Error fetching recent Jira projects", e);
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
            logger.info("Received request for all Jira projects");
            List<JiraProject> projects = jiraService.getAllProjects();
            logger.info("Returning {} projects", projects.size());
            return ResponseEntity.ok(projects);
        } catch (Exception e) {
            logger.error("Error fetching all Jira projects", e);
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
            logger.info("Received request for Jira project with ID/Key: {}", projectIdOrKey);
            JiraProject project = jiraService.getProjectByIdOrKey(projectIdOrKey);
            logger.info("Returning project: {}", project.getKey());
            return ResponseEntity.ok(project);
        } catch (Exception e) {
            logger.error("Error fetching Jira project with ID/Key: {}", projectIdOrKey, e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch project: " + e.getMessage()));
        }
    }

    /**
     * Get issues for a specific Jira project
     * @param projectKey The project key
     * @return The issues for the project
     */
    @GetMapping("/projects/{projectKey}/issues")
    public ResponseEntity<?> getIssuesForProject(@PathVariable String projectKey) {
        try {
            logger.info("Received request for issues in Jira project: {}", projectKey);
            JsonNode issuesResponse = jiraService.getIssuesForProject(projectKey);
            logger.info("Returning issues for project: {}", projectKey);
            return ResponseEntity.ok(issuesResponse);
        } catch (Exception e) {
            logger.error("Error fetching issues for project: {}", projectKey, e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch issues: " + e.getMessage()));
        }
    }

    /**
     * Get all fields from Jira
     * @return The fields from Jira
     */
    @GetMapping("/fields")
    public ResponseEntity<?> getFields() {
        try {
            logger.info("Received request for Jira fields");
            JsonNode fields = jiraService.getFields();
            logger.info("Returning fields from Jira");
            return ResponseEntity.ok(fields);
        } catch (Exception e) {
            logger.error("Error fetching fields from Jira", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch fields: " + e.getMessage()));
        }
    }

    /**
     * Get all issue types from Jira
     * @return The issue types from Jira
     */
    @GetMapping("/issuetypes")
    public ResponseEntity<?> getIssueTypes() {
        try {
            logger.info("Received request for Jira issue types");
            JsonNode issueTypes = jiraService.getIssueTypes();
            logger.info("Returning issue types from Jira");
            return ResponseEntity.ok(issueTypes);
        } catch (Exception e) {
            logger.error("Error fetching issue types from Jira", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch issue types: " + e.getMessage()));
        }
    }

    /**
     * Get users assignable to issues in a project
     * @param projectKey The project key
     * @return The assignable users for the project
     */
    @GetMapping("/projects/{projectKey}/assignable")
    public ResponseEntity<?> getAssignableUsers(@PathVariable String projectKey) {
        try {
            logger.info("Received request for assignable users in Jira project: {}", projectKey);
            JsonNode users = jiraService.getAssignableUsers(projectKey);
            logger.info("Returning assignable users for project: {}", projectKey);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Error fetching assignable users for project: {}", projectKey, e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch assignable users: " + e.getMessage()));
        }
    }

    /**
     * Create a new Jira issue
     * @param issueData The issue data to create
     * @return The created issue
     */
    @PostMapping("/issues")
    public ResponseEntity<?> createIssue(@RequestBody Map<String, Object> issueData) {
        try {
            logger.info("Received request to create new Jira issue");
            JsonNode createdIssue = jiraService.createIssue(issueData);
            logger.info("Issue created successfully");
            return ResponseEntity.ok(createdIssue);
        } catch (Exception e) {
            logger.error("Error creating Jira issue", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to create issue: " + e.getMessage()));
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
            logger.info("Received request to create new Jira project");
            Object createdProject = jiraService.createProject(projectData);
            logger.info("Project created successfully");
            return ResponseEntity.ok(createdProject);
        } catch (Exception e) {
            logger.error("Error creating Jira project", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to create project: " + e.getMessage()));
        }
    }

    /**
     * Delete a Jira project
     * @param projectKey The project key to delete
     * @return Success or error response
     */
    @DeleteMapping("/projects/{projectKey}")
    public ResponseEntity<?> deleteProject(@PathVariable String projectKey) {
        try {
            logger.info("Received request to delete Jira project with key: {}", projectKey);
            JsonNode response = jiraService.deleteProject(projectKey);
            logger.info("Project deleted successfully: {}", projectKey);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error deleting Jira project with key: {}", projectKey, e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to delete project: " + e.getMessage()));
        }
    }
}