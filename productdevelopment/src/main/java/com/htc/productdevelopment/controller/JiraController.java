package com.htc.productdevelopment.controller;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.htc.productdevelopment.model.ContractAttachment;
import com.htc.productdevelopment.model.ContractDetails;
import com.htc.productdevelopment.model.ContractProposal;
import com.htc.productdevelopment.model.JiraProject;
import com.htc.productdevelopment.config.JiraFieldConfig;
import com.htc.productdevelopment.model.Proposal;
import com.htc.productdevelopment.repository.ContractAttachmentRepository;
import com.htc.productdevelopment.repository.ContractDetailsRepository;
import com.htc.productdevelopment.repository.ContractProposalRepository;
import com.htc.productdevelopment.dto.ContractCompletedRequest;
import com.htc.productdevelopment.dto.ContractDTO;
import com.htc.productdevelopment.dto.VendorDetailsDTO;
import com.htc.productdevelopment.service.JiraService;
import com.htc.productdevelopment.service.ContractDetailsService;
import com.htc.productdevelopment.service.VendorDetailsService;
import com.htc.productdevelopment.service.ProposalService;
import com.htc.productdevelopment.service.ContractAttachmentService;
import com.htc.productdevelopment.service.ContractProposalService;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpMethod;




import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;

import org.springframework.http.HttpEntity;  // ✔ CORRECT

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Controller class for handling Jira-related API requests
 * This controller provides endpoints for managing Jira projects and issues
 */
@RestController
@RequestMapping("/api/jira")

public class JiraController {

    // Logger for tracking controller operations
    private static final Logger logger = LoggerFactory.getLogger(JiraController.class);
    
    // Service for handling Jira operations
    private final JiraService jiraService;
    private final ContractDetailsService contractDetailsService;
    private final VendorDetailsService vendorDetailsService;
    private final ContractProposalService contractProposalService;
    private final JiraFieldConfig jiraFieldConfig;

    @Autowired
    private ContractDetailsRepository contractDetailsRepository;

    @Autowired
    private ContractAttachmentRepository contractAttachmentRepository;

    @Autowired
    private ContractProposalRepository contractProposalRepository;
    
    @Autowired
    private ProposalService proposalService;
    
    @Autowired
    private ContractAttachmentService contractAttachmentService;

    public JiraController(JiraService jiraService,
                          ContractDetailsService contractDetailsService,
                          VendorDetailsService vendorDetailsService,
                          ContractProposalService contractProposalService,
                          JiraFieldConfig jiraFieldConfig) {
        this.jiraService = jiraService;
        this.contractDetailsService = contractDetailsService;
        this.vendorDetailsService = vendorDetailsService;
        this.contractProposalService = contractProposalService;
        this.jiraFieldConfig = jiraFieldConfig;
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
            // Provide more detailed error information to the frontend
            String errorMessage = "Failed to fetch project: " + e.getMessage();
            if (e.getCause() != null && e.getCause().getMessage() != null) {
                errorMessage += " - " + e.getCause().getMessage();
            }
            return ResponseEntity.internalServerError().body(Map.of("message", errorMessage));
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
     * Get recent issues across all projects (max 3)
     * @return Recent issues from all projects
     */
    @GetMapping("/issues/recent")
    public ResponseEntity<?> getRecentIssues() {
        try {
            logger.info("Received request for recent issues across all projects");
            JsonNode recentIssues = jiraService.getRecentIssues();
            logger.info("Returning recent issues");
            // Return the issues array directly instead of the full response
            if (recentIssues.has("issues")) {
                return ResponseEntity.ok(recentIssues.get("issues"));
            } else {
                return ResponseEntity.ok(recentIssues);
            }
        } catch (Exception e) {
            logger.error("Error fetching recent issues", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch recent issues: " + e.getMessage()));
        }
    }

    /**
     * Get all issues across all projects with role-based filtering
     * @return All issues from all projects
     */
    @GetMapping("/issues")
    public ResponseEntity<?> getAllIssues(
            @RequestParam(required = false) String userRole,
            @RequestParam(required = false) Long userOrganizationId,
            @RequestParam(required = false) Long userDepartmentId,
            @RequestParam(required = false) String userEmail){
        try {
            logger.info("Received request for all issues across all projects with user context - Role: {}, Organization ID: {}, Department ID: {}", 
                userRole, userOrganizationId, userDepartmentId);
            
            // Add debug logging to see what values are actually received
            if (userRole == null) {
                logger.warn("User role is null");
            }
            if (userOrganizationId == null) {
                logger.warn("User organization ID is null");
            }
            if (userDepartmentId == null) {
                logger.warn("User department ID is null");
            }
            
            JsonNode allIssues = jiraService.getAllIssues(userRole, userOrganizationId, userDepartmentId, userEmail);
            logger.info("Returning all issues");
            // Return the issues array directly instead of the full response
            if (allIssues.has("issues")) {
                return ResponseEntity.ok(allIssues.get("issues"));
            } else {
                return ResponseEntity.ok(allIssues);
            }
        } catch (Exception e) {
            logger.error("Error fetching all issues", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch all issues: " + e.getMessage()));
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
            // Provide more detailed error information to the frontend
            String errorMessage = "Failed to fetch fields: " + e.getMessage();
            if (e.getCause() != null && e.getCause().getMessage() != null) {
                errorMessage += " - " + e.getCause().getMessage();
            }
            return ResponseEntity.internalServerError().body(Map.of("message", errorMessage));
        }
    }

    /**
     * Test connectivity to Jira API
     * @return Success or error response
     */
    @GetMapping("/test-connectivity")
    public ResponseEntity<?> testJiraConnectivity() {
        try {
            logger.info("Received request to test Jira connectivity");
            logger.info("Jira config - Base URL: {}, Email: {}", jiraService.getJiraConfig().getBaseUrl(), jiraService.getJiraConfig().getEmail());
            
            boolean success = jiraService.testJiraConnectivity();
            if (success) {
                logger.info("Jira connectivity test successful");
                return ResponseEntity.ok(Map.of("message", "Jira connectivity test successful"));
            } else {
                logger.warn("Jira connectivity test failed");
                return ResponseEntity.internalServerError().body(Map.of("message", "Jira connectivity test failed"));
            }
        } catch (Exception e) {
            logger.error("Error testing Jira connectivity", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to test Jira connectivity: " + e.getMessage()));
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
            // Provide more detailed error information to the frontend
            String errorMessage = "Failed to fetch issue types: " + e.getMessage();
            if (e.getCause() != null && e.getCause().getMessage() != null) {
                errorMessage += " - " + e.getCause().getMessage();
            }
            return ResponseEntity.internalServerError().body(Map.of("message", errorMessage));
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
            logger.info("Received request to create new Jira issue with data: {}", issueData);
            JsonNode createdIssue = jiraService.createIssue(issueData);
            logger.info("Issue created successfully: {}", createdIssue);
            return ResponseEntity.ok(createdIssue);
        } catch (Exception e) {
            logger.error("Error creating Jira issue with data: {}", issueData, e);
            // Provide more detailed error information to the frontend
            String errorMessage = "Failed to create issue: " + e.getMessage();
            if (e.getCause() != null && e.getCause().getMessage() != null) {
                errorMessage += " - " + e.getCause().getMessage();
            }
            return ResponseEntity.internalServerError().body(Map.of("message", errorMessage));
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

    /**
     * Delete a Jira issue
     * @param issueIdOrKey The issue ID or key to delete
     * @return Success or error response
     */
    @DeleteMapping("/issues/{issueIdOrKey}")
    public ResponseEntity<?> deleteIssue(@PathVariable String issueIdOrKey) {
        try {
            logger.info("Received request to delete Jira issue with ID/Key: {}", issueIdOrKey);
            JsonNode response = jiraService.deleteIssue(issueIdOrKey);
            logger.info("Issue deleted successfully: {}", issueIdOrKey);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error deleting Jira issue with ID/Key: {}", issueIdOrKey, e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to delete issue: " + e.getMessage()));
        }
    }
    
    /**
     * Get a specific Jira issue by ID or key with all details
     * @param issueIdOrKey The issue ID or key
     * @return The Jira issue details
     */
    @GetMapping("/issues/{issueIdOrKey}")
    public ResponseEntity<?> getIssueByIdOrKey(@PathVariable String issueIdOrKey) {
        try {
            logger.info("Received request for Jira issue with ID/Key: {}", issueIdOrKey);
            JsonNode issue = jiraService.getIssueByIdOrKey(issueIdOrKey);
            logger.info("Returning issue: {}", issueIdOrKey);
            return ResponseEntity.ok(issue);
        } catch (Exception e) {
            logger.error("Error fetching Jira issue with ID/Key: {}", issueIdOrKey, e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch issue: " + e.getMessage()));
        }
    }
    
    /**
     * Get comments for a specific Jira issue
     * @param issueIdOrKey The issue ID or key
     * @return The comments for the issue
     */
    @GetMapping("/issues/{issueIdOrKey}/comments")
    public ResponseEntity<?> getIssueComments(@PathVariable String issueIdOrKey) {
        try {
            logger.info("Received request for comments of Jira issue: {}", issueIdOrKey);
            JsonNode comments = jiraService.getIssueComments(issueIdOrKey);
            logger.info("Returning comments for issue: {}", issueIdOrKey);
            return ResponseEntity.ok(comments);
        } catch (Exception e) {
            logger.error("Error fetching comments for issue: {}", issueIdOrKey, e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch comments: " + e.getMessage()));
        }
    }
    
    /**
     * Get worklogs for a specific Jira issue
     * @param issueIdOrKey The issue ID or key
     * @return The worklogs for the issue
     */
    @GetMapping("/issues/{issueIdOrKey}/worklogs")
    public ResponseEntity<?> getIssueWorklogs(@PathVariable String issueIdOrKey) {
        try {
            logger.info("Received request for worklogs of Jira issue: {}", issueIdOrKey);
            JsonNode worklogs = jiraService.getIssueWorklogs(issueIdOrKey);
            logger.info("Returning worklogs for issue: {}", issueIdOrKey);
            return ResponseEntity.ok(worklogs);
        } catch (Exception e) {
            logger.error("Error fetching worklogs for issue: {}", issueIdOrKey, e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch worklogs: " + e.getMessage()));
        }
    }
    
    /**
     * Update a Jira issue
     * @param issueIdOrKey The issue ID or key to update
     * @param issueData The issue data to update
     * @return The updated issue
     */
    @PutMapping("/issues/{issueIdOrKey}")
    public ResponseEntity<?> updateIssue(@PathVariable String issueIdOrKey, @RequestBody Map<String, Object> issueData) {
        try {
            logger.info("Received request to update Jira issue: {}", issueIdOrKey);
            JsonNode updatedIssue = jiraService.updateIssue(issueIdOrKey, issueData);
            logger.info("Issue updated successfully: {}", issueIdOrKey);
            return ResponseEntity.ok(updatedIssue);
        } catch (Exception e) {
            logger.error("Error updating Jira issue: {}", issueIdOrKey, e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to update issue: " + e.getMessage()));
        }
    }
    
    /**
     * Add an attachment to a Jira issue (using Jira Cloud-compliant API)
     * @param issueIdOrKey The issue ID or key
     * @param file The file to attach
     * @return Success or error response
     */
    @PostMapping(
            value = "/issues/{issueIdOrKey}/attachments",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> uploadAttachment(
            @PathVariable String issueIdOrKey,
            @RequestPart("file") MultipartFile file
    ) {
        try {
            logger.info("📥 Received Jira attachment upload for issue {}", issueIdOrKey);

            JsonNode response = jiraService.addAttachmentToIssue(
                    issueIdOrKey,
                    file.getBytes(),
                    file.getOriginalFilename()
            );

            logger.info("📤 Attachment uploaded successfully to Jira!");
            
            // Save attachment metadata to our database
            if (response != null && response.isArray() && response.size() > 0) {
                JsonNode attachmentInfo = response.get(0);
                
                String fileName = attachmentInfo.has("filename") ? attachmentInfo.get("filename").asText() : file.getOriginalFilename();
                // Use our own endpoint to serve the file instead of Jira's URL
                String fileUrl = "/api/jira/contracts/attachments/" + attachmentInfo.get("id").asText() + "/content";
                long fileSize = attachmentInfo.has("size") ? attachmentInfo.get("size").asLong() : file.getSize();
                String mimeType = attachmentInfo.has("mimeType") ? attachmentInfo.get("mimeType").asText() : file.getContentType();
                // Removed fileContent since we're no longer storing attachment content in DB
                // Jira handles attachment storage
                
                logger.info("📎 Saving attachment metadata - fileName: {}, fileSize: {}, mimeType: {}", fileName, fileSize, mimeType);
                
                // Save to our database
                ContractAttachment attachment = new ContractAttachment();
                attachment.setJiraIssueKey(issueIdOrKey);
                attachment.setFileName(fileName);
                attachment.setFileUrl(fileUrl);
                attachment.setFileSize(fileSize);
                attachment.setMimeType(mimeType);
                attachment.setUploadedBy("system");
                attachment.setStage("CREATION");
                // Removed setting fileContent since we're not storing it anymore
                
                contractAttachmentRepository.save(attachment);
                
                logger.info("💾 Attachment metadata saved to database for issue {}", issueIdOrKey);
            } else {
                logger.warn("⚠ No attachment response received from Jira for issue {}", issueIdOrKey);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ Error uploading attachment to Jira", e);
            return ResponseEntity.status(500)
                    .body(Map.of("error", e.getMessage()));
        }
    }



    
    /**
     * Get attachments for a Jira issue
     * @param issueIdOrKey The issue ID or key
     * @return The attachments for the issue
     */
    @GetMapping("/issues/{issueIdOrKey}/attachments")
    public ResponseEntity<?> getIssueAttachments(@PathVariable String issueIdOrKey) {
        try {
            logger.info("Received request for attachments of Jira issue: {}", issueIdOrKey);
            JsonNode attachments = jiraService.getIssueAttachments(issueIdOrKey);
            logger.info("Returning attachments for issue: {}", issueIdOrKey);
            return ResponseEntity.ok(attachments);
        } catch (Exception e) {
            logger.error("Error fetching attachments for issue: {}", issueIdOrKey, e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch attachments: " + e.getMessage()));
        }
    }
    
    /**
     * Get attachment content by ID
     * @param attachmentId The attachment ID
     * @return The attachment content
     */
    @GetMapping("/attachment/content/{attachmentId}")
    public ResponseEntity<?> getAttachmentContent(@PathVariable String attachmentId) {
        try {
            logger.info("Received request for attachment content with ID: {}", attachmentId);
            byte[] content = jiraService.getAttachmentContent(attachmentId);
            logger.info("Returning attachment content for ID: {}", attachmentId);
            return ResponseEntity.ok(content);
        } catch (Exception e) {
            logger.error("Error fetching attachment content for ID: {}", attachmentId, e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch attachment content: " + e.getMessage()));
        }
    }
    
    /**
     * Get transitions available for a specific Jira issue
     * @param issueIdOrKey The issue ID or key
     * @return The available transitions for the issue
     */
    @GetMapping("/issues/{issueIdOrKey}/transitions")
    public ResponseEntity<?> getIssueTransitions(@PathVariable String issueIdOrKey) {
        try {
            logger.info("Received request for transitions of Jira issue: {}", issueIdOrKey);
            JsonNode raw = jiraService.getIssueTransitions(issueIdOrKey);

            JsonNode array = raw != null && raw.has("transitions") ? raw.get("transitions") : raw;
            if (array == null || !array.isArray()) {
                logger.info("No transitions array present, returning empty array");
                return ResponseEntity.ok(new com.fasterxml.jackson.databind.node.ArrayNode(
                        new com.fasterxml.jackson.databind.node.JsonNodeFactory(false)
                ));
            }

            logger.info("Returning {} transitions", array.size());
            return ResponseEntity.ok(array);
        } catch (Exception e) {
            logger.error("Error fetching transitions for issue: {}", issueIdOrKey, e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch transitions: " + e.getMessage()));
        }
    }
    
    /**
     * Transition a Jira issue to a new status
     * @param issueIdOrKey The issue ID or key
     * @param transitionData The transition data containing the transition ID
     * @return Success or error response
     */
    @PostMapping("/issues/{issueIdOrKey}/transitions")
    public ResponseEntity<?> transitionIssue(
            @PathVariable String issueIdOrKey,
            @RequestBody Map<String, Object> transitionData
    ) {
        try {
            logger.info("Received request to transition Jira issue: {} with data: {}", issueIdOrKey, transitionData);

            // Accept BOTH:
            // 1) { "transition": { "id": "123" } }  (Jira standard)
            // 2) { "transitionId": "123" }          (old FE shape)
            String transitionId = null;

            Object transitionObj = transitionData.get("transition");
            if (transitionObj instanceof Map<?, ?> transitionMap) {
                Object idObj = transitionMap.get("id");
                if (idObj != null) transitionId = String.valueOf(idObj);
            }
            if (transitionId == null) {
                Object flatId = transitionData.get("transitionId");
                if (flatId != null) transitionId = String.valueOf(flatId);
            }

            if (transitionId == null || transitionId.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Transition ID is required"));
            }

            jiraService.transitionIssue(issueIdOrKey, transitionId);
            logger.info("Issue transitioned successfully: {} -> {}", issueIdOrKey, transitionId);

            // Mirror Jira's 204 No Content for success
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Error transitioning issue: {}", issueIdOrKey, e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to transition issue: " + e.getMessage()));
        }
    }

    
    /**
     * Get current user information
     * @return The current user information
     */
    @GetMapping("/myself")
    public ResponseEntity<?> getCurrentUser() {
        try {
            logger.info("Received request for current user information");
            JsonNode currentUser = jiraService.getCurrentUser();
            logger.info("Returning current user information");
            return ResponseEntity.ok(currentUser);
        } catch (Exception e) {
            logger.error("Error fetching current user information", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch current user information: " + e.getMessage()));
        }
    }
    
    /**
     * Get metadata for creating issues in Jira
     * @param projectKeys Optional project keys to filter issue types
     * @return The create metadata
     */
    @GetMapping("/issue/createmeta")
    public ResponseEntity<?> getCreateMeta(@RequestParam(required = false) String projectKeys) {
        try {
            logger.info("Received request for create metadata with project keys: {}", projectKeys);
            JsonNode createMeta = jiraService.getCreateMeta(projectKeys);
            logger.info("Create metadata response type: {}", createMeta != null ? createMeta.getClass().getName() : "null");
            if (createMeta != null && createMeta.isArray()) {
                logger.info("Create metadata array size: {}", createMeta.size());
            } else if (createMeta != null && createMeta.isObject()) {
                logger.info("Create metadata object keys: {}", createMeta.fieldNames().toString());
            }
            logger.info("Returning create metadata");
            return ResponseEntity.ok(createMeta);
        } catch (Exception e) {
            logger.error("Error fetching create metadata", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch create metadata: " + e.getMessage()));
        }
    }
    
    /**
     * Create a new Jira issue with the proper Jira API structure
     * @param issueData The issue data to create
     * @return The created issue
     */
    @PostMapping("/issues/create")
    public ResponseEntity<?> createIssueJira(@RequestBody Map<String, Object> issueData) {
        try {
            logger.info("Received request to create new Jira issue with Jira API structure");
            JsonNode createdIssue = jiraService.createIssueJira(issueData);
            logger.info("Issue created successfully with Jira API structure");
            return ResponseEntity.ok(createdIssue);
        } catch (Exception e) {
            logger.error("Error creating Jira issue with Jira API structure", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to create issue: " + e.getMessage()));
        }
    }
    
    /**
     * Add a comment to a Jira issue
     * @param issueIdOrKey The issue ID or key
     * @param commentData The comment data containing the comment body
     * @return The created comment
     */
    @PostMapping("/issues/{issueIdOrKey}/comments")
    public ResponseEntity<?> addCommentToIssue(@PathVariable String issueIdOrKey, @RequestBody Map<String, Object> commentData) {
        try {
            logger.info("Received request to add comment to Jira issue: {} with data: {}", issueIdOrKey, commentData);
            
            String commentBody = (String) commentData.get("body");
            if (commentBody == null || commentBody.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Comment body is required"));
            }
            
            JsonNode response = jiraService.addComment(issueIdOrKey, commentBody);
            logger.info("Comment added successfully to issue: {}", issueIdOrKey);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error adding comment to issue: {}", issueIdOrKey, e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to add comment: " + e.getMessage()));
        }
    }
    
    /**
     * Save proposal data with attachments
     * @param proposalData The proposal data to save
     * @return The saved proposal
     */
    @PostMapping("/proposals")
    public ResponseEntity<?> saveProposal(@RequestBody Proposal proposalData) {
        try {
            logger.info("Received request to save proposal data: {}", proposalData);
            
            Proposal savedProposal = proposalService.saveProposal(proposalData);
            logger.info("Proposal saved successfully with ID: {}", savedProposal.getId());
            
            return ResponseEntity.ok(savedProposal);
        } catch (Exception e) {
            logger.error("Error saving proposal", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to save proposal: " + e.getMessage()));
        }
    }

    /**
     * Get all proposals for a specific issue
     * @param issueKey The issue key
     * @return List of proposals for the issue
     */
    @GetMapping("/proposals/issue/{issueKey}")
    public ResponseEntity<?> getProposalsByIssueKey(@PathVariable String issueKey) {
        try {
            logger.info("Received request to fetch proposals for issue: {}", issueKey);

            if (issueKey == null || issueKey.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Issue key cannot be empty"));
            }

            String cleanedKey = issueKey.trim();

            List<ContractProposal> proposals = new ArrayList<>();
            try {
                proposals = contractProposalRepository.findByJiraIssueKeyIgnoreCaseOrderByProposalNumberAsc(cleanedKey);
            } catch (Exception e) {
                logger.warn("Failed to fetch proposals from database for issueKey: {}", cleanedKey, e);
                // Return empty list instead of error
                proposals = new ArrayList<>();
            }

            logger.info("Found {} proposals for issue: {}", proposals.size(), cleanedKey);

            return ResponseEntity.ok(
            	    proposals.stream().map(p -> {
            	        Map<String, Object> proposalMap = new HashMap<>();
            	        proposalMap.put("id", p.getId());
            	        proposalMap.put("jiraIssueKey", p.getJiraIssueKey());
            	        proposalMap.put("proposalNumber", p.getProposalNumber());
            	        proposalMap.put("licenseCount", p.getLicenseCount());
            	        proposalMap.put("unitCost", p.getUnitCost());
            	        proposalMap.put("totalCost", p.getTotalCost());
            	        proposalMap.put("comment", p.getComment());
            	        proposalMap.put("isFinal", p.isFinal());
            	        proposalMap.put("isFinalSubmitted", p.isFinalSubmitted());
            	        proposalMap.put("proposalType", p.getProposalType());
            	        proposalMap.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
            	        return proposalMap;
            	    }).toList()
            	);
        } catch (Exception e) {
            logger.error("Error fetching proposals for issue: {}", issueKey, e);
            // Return empty list instead of error to avoid breaking the UI
            return ResponseEntity.ok(new ArrayList<>());
        }
    }



 // -------------------------------------------------------------------------
 // 📦 Vendor Details Endpoints
 // -------------------------------------------------------------------------

 // 1️⃣ Fetch all vendors for dropdown
 @GetMapping("/vendors")
 public ResponseEntity<?> getAllVendors() {
     try {
    	 logger.info("Fetching all vendors for dropdown");
         return ResponseEntity.ok(vendorDetailsService.getAllVendors());
     } catch (Exception e) {
         return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch vendors: " + e.getMessage()));
     }
 }

 // 2️⃣ Fetch all products for a given vendor
 @GetMapping("/vendors/{vendorName}/products")
 public ResponseEntity<?> getVendorProducts(@PathVariable String vendorName) {
     try {
    	 logger.info("Fetching all products for vendor: {}", vendorName);
         return ResponseEntity.ok(vendorDetailsService.getProductsByVendor(vendorName));
     } catch (Exception e) {
         return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch products: " + e.getMessage()));
     }
 }

 // -------------------------------------------------------------------------
 // 📄 Contract Details Endpoints
 // -------------------------------------------------------------------------

 // 3️⃣ Fetch contract details for a given vendor
 @GetMapping("/contracts/vendor/{vendorName}")
 public ResponseEntity<?> getContractsByVendor(@PathVariable String vendorName) {
     try {
         return ResponseEntity.ok(contractDetailsService.getContractsByVendor(vendorName));
     } catch (Exception e) {
         return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch contract details: " + e.getMessage()));
     }
 }
 
 @GetMapping("/contracts")
 public ResponseEntity<?> getAllContracts() {
     try {
        logger.info("Received request to fetch all contracts");
        return ResponseEntity.ok(contractDetailsService.getAllContracts());
    } catch (Exception e) {
        logger.error("Error fetching all contracts", e);
        return (ResponseEntity<?>) ResponseEntity.internalServerError()
                .body(Map.of("message", "Failed to fetch contracts: " + e.getMessage()));
    }
}

// Add this new endpoint for fetching contracts by type as DTOs
@GetMapping("/contracts/type/{contractType}/dto")
public ResponseEntity<?> getContractsByTypeAsDTO(@PathVariable String contractType) {
    try {
        logger.info("Received request to fetch contracts by type: {}", contractType);
        List<ContractDTO> contracts = contractDetailsService.getContractsByTypeAsDTO(contractType);
        logger.info("Returning {} contracts", contracts.size());
        return ResponseEntity.ok(contracts);
    } catch (Exception e) {
        logger.error("Error fetching contracts by type: {}", contractType, e);
        return ResponseEntity.internalServerError()
                .body(Map.of("message", "Failed to fetch contracts: " + e.getMessage()));
    }
}

@PostMapping("/contracts/create")
public ResponseEntity<?> createContractIssue(@RequestBody Map<String,Object> issueData) {
    try {
        JsonNode result = jiraService.createIssueJira(issueData);
        return ResponseEntity.ok(result);
    } catch (Exception ex) {
        return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
    }
}

// 4️⃣ Fetch existing license count (for upgrade/downgrade/flat renewal logic)
@GetMapping("/contracts/vendor/{vendorName}/licenses")
public ResponseEntity<?> getLicenseCount(@PathVariable String vendorName,
                                          @RequestParam(required = false) String productName) {
    try {
        Integer count = contractDetailsService.getExistingLicenseCount(vendorName, productName);
        return ResponseEntity.ok(Map.of("existingLicenseCount", count != null ? count : 0));
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch license count: " + e.getMessage()));
    }
 }

    
@GetMapping("/projects/request-management")
public ResponseEntity<?> getRequestManagementProject() {
    try {
        JsonNode project = jiraService.getRequestManagementProject();
        return ResponseEntity.ok(project);
    } catch (Exception e) {
        return ResponseEntity.internalServerError()
            .body(Map.of("message", "Failed to fetch Request Management project: " + e.getMessage()));
    }
}

/**
 * Get all completed contract details for procurement renewal page
 * @return List of completed contract details
 */
@GetMapping("/contracts/completed")
public ResponseEntity<?> getCompletedContracts() {
    try {
        logger.info("Fetching COMPLETED contracts (renewalStatus=completed)");

        List<ContractDetails> completed = 
                contractDetailsService.getContractsByRenewalStatus("completed");

        List<ContractDTO> dtoList = completed.stream().map(c -> {
            ContractDTO dto = new ContractDTO();

            dto.setId(c.getId());
            dto.setContractType(c.getContractType());
            dto.setRenewalStatus(c.getRenewalStatus());   // ⭐ IMPORTANT
            dto.setJiraIssueKey(c.getJiraIssueKey());

            dto.setNameOfVendor(c.getNameOfVendor());
            dto.setProductName(c.getProductName());
            dto.setRequesterName(c.getRequesterName());
            dto.setRequesterEmail(c.getRequesterMail());
            dto.setRequesterDepartment(c.getRequesterDepartment());
            dto.setRequesterOrganization(c.getRequesterOrganization());

            dto.setVendorContractType(c.getVendorContractType());
            dto.setAdditionalComment(c.getAdditionalComment());
            dto.setBillingType(c.getBillingType());
            dto.setLicenseUpdateType(c.getLicenseUpdateType());
            dto.setExistingContractId(c.getExistingContractId());

            dto.setCurrentLicenseCount(c.getCurrentLicenseCount());
            dto.setCurrentUsageCount(c.getCurrentUsageCount());
            dto.setCurrentUnits(c.getCurrentUnits());

            dto.setNewLicenseCount(c.getNewLicenseCount());
            dto.setNewUsageCount(c.getNewUsageCount());
            dto.setNewUnits(c.getNewUnits());

            dto.setDueDate(c.getDueDate() != null ? c.getDueDate().toString() : null);
            dto.setRenewalDate(c.getRenewalDate() != null ? c.getRenewalDate().toString() : null);

            return dto;
        }).toList();

        return ResponseEntity.ok(dtoList);

    } catch (Exception e) {
        logger.error("Error fetching completed contracts", e);
        return ResponseEntity.status(500)
                .body(Map.of("message", e.getMessage()));
    }
}


//@GetMapping("/contracts/test")
//public ResponseEntity<?> testContractData() {
//    try {
//        logger.info("Testing contract data retrieval");
//        List<ContractDetails> allContracts = contractDetailsService.getAllContracts();
//        logger.info("Total contracts in database: {}", allContracts.size());
//        
////        List<ContractDetails> completedContracts = contractDetailsService.getContractsByTypeIgnoreCase("completed");
//        logger.info("Completed contracts in database: {}", completedContracts.size());
//        
//        return ResponseEntity.ok(Map.of(
//            "totalContracts", allContracts.size(),
//            "completedContracts", completedContracts.size(),
//            "sampleContracts", completedContracts.size() > 0 ? completedContracts.subList(0, Math.min(3, completedContracts.size())) : "No contracts found"
//        ));
//    } catch (Exception e) {
//        logger.error("Error testing contract data", e);
//        return ResponseEntity.internalServerError()
//                .body(Map.of("message", "Failed to test contract data: " + e.getMessage()));
//    }
//}

//@GetMapping("/contracts/debug-completed")
//public ResponseEntity<?> debugCompletedContracts() {
//    try {
//        logger.info("Debug: Received request to fetch completed contracts");
//        List<ContractDetails> contracts = contractDetailsService.getContractsByTypeIgnoreCase("completed");
//
//        logger.info("Debug: Found {} completed contracts", contracts.size());
//        
//        // Log details of each contract
//        for (int i = 0; i < contracts.size(); i++) {
//            ContractDetails c = contracts.get(i);
//            logger.info("Debug: Contract {}: ID={}, Vendor={}, Product={}", 
//                i, c.getId(), c.getNameOfVendor(), c.getProductName());
//            
//            // Check for potential null issues
//            try {
//                logger.debug("Debug: Contract {} dates: Due={}, Renewal={}", 
//                    i, c.getDueDate(), c.getRenewalDate());
//            } catch (Exception e) {
//                logger.error("Debug: Error accessing dates for contract {}: {}", i, e.getMessage());
//            }
//            
//            // Log all fields for debugging
//            try {
//                logger.debug("Debug: Contract {} full data: {}", i, c.toString());
//            } catch (Exception e) {
//                logger.error("Debug: Error converting contract {} to string: {}", i, e.getMessage());
//            }
//        }
//        
//        return ResponseEntity.ok(Map.of(
//            "message", "Debug completed",
//            "contractCount", contracts.size(),
//            "contracts", contracts.size() > 0 ? contracts.subList(0, Math.min(3, contracts.size())) : "No contracts"
//        ));
//    } catch (Exception e) {
//        logger.error("Debug: Error fetching completed contracts", e);
//        return ResponseEntity.internalServerError()
//                .body(Map.of(
//                    "message", "Debug failed: " + e.getMessage(), 
//                    "error", e.getClass().getName(),
//                    "stackTrace", e.getStackTrace().length > 0 ? e.getStackTrace()[0].toString() : "No stack trace"
//                ));
//    }
//}

//----------------------------------------------------------
//⭐ NEW API — Save contract as COMPLETED
//----------------------------------------------------------
@PostMapping("/contracts/mark-completed")
public ResponseEntity<?> markContractCompleted(@RequestBody ContractCompletedRequest request) {
    try {
        logger.info("Received request to mark contract as completed: {}", request);

        if (request.getIssueKey() == null || request.getTransitionKey() == null) {
            return ResponseEntity.badRequest().body("Missing issueKey or transitionKey");
        }

        // ⭐ 1. CHECK CURRENT STATUS FIRST
        String currentStatus = jiraService.getIssueStatus(request.getIssueKey());
        logger.info("Current Jira status for {} is: {}", request.getIssueKey(), currentStatus);

        // If already completed → SKIP Jira transition
        if (currentStatus != null && currentStatus.equalsIgnoreCase("completed")) {
            logger.warn("Skipping Jira transition — issue already completed.");
        } else {
            // ⭐ 2. TRANSITION ONLY IF NOT COMPLETED
            boolean success = jiraService.transitionIssueByKey(
                    request.getIssueKey(),
                    request.getTransitionKey()
            );

            if (!success) {
                return ResponseEntity.badRequest().body("Transition failed");
            }
        }

        // ⭐ 3. SAVE CONTRACT DATA
        ContractDetails contract = contractDetailsService.findByJiraIssueKey(request.getIssueKey());
        if (contract == null) {
            contract = new ContractDetails();
        }

        contract.setRenewalStatus("completed");
        contract.setJiraIssueKey(request.getIssueKey());
        contract.setContractType("existing");
        contract.setNameOfVendor(request.getNameOfVendor());
        contract.setProductName(request.getProductName());
        contract.setRequesterName(request.getRequesterName());
        contract.setRequesterMail(request.getRequesterMail());
        contract.setRequesterDepartment(request.getRequesterDepartment());
        contract.setRequesterOrganization(request.getRequesterOrganization());
        contract.setCurrentLicenseCount(request.getCurrentLicenseCount());
        contract.setCurrentUsageCount(request.getCurrentUsageCount());
        contract.setCurrentUnits(request.getCurrentUnits());
        contract.setNewLicenseCount(request.getNewLicenseCount());
        contract.setNewUsageCount(request.getNewUsageCount());
        contract.setNewUnits(request.getNewUnits());
        contract.setAdditionalComment(request.getAdditionalComment());
        contract.setVendorContractType(request.getVendorContractType());
        contract.setLicenseUpdateType(request.getLicenseUpdateType());
        contract.setExistingContractId(request.getExistingContractId());
        contract.setBillingType(request.getBillingType());

        if (request.getDueDate() != null && !request.getDueDate().trim().isEmpty()) {
            contract.setDueDate(LocalDate.parse(request.getDueDate()));
        }

        if (request.getRenewalDate() != null && !request.getRenewalDate().trim().isEmpty()) {
            contract.setRenewalDate(LocalDate.parse(request.getRenewalDate()));
        }

        ContractDetails saved = contractDetailsService.saveCompletedContract(contract);
        logger.info("Completed contract saved with ID: {}", saved.getId());

        return ResponseEntity.ok(Map.of("message", "Contract saved successfully!"));

    } catch (Exception e) {
        logger.error("Error saving completed contract", e);
        return ResponseEntity.status(500)
                .body(Map.of("message", e.getMessage()));
    }
}
    /**
     * Get profit data for a contract
     * @param issueKey The Jira issue key
     * @return Profit data and submission status
     */
    @GetMapping("/contracts/profit/{issueKey}")
    public ResponseEntity<?> getContractProfit(@PathVariable String issueKey) {
        try {
            logger.info("Received request for profit data for issueKey: {}", issueKey);
            
            // Validate required fields
            if (issueKey == null || issueKey.isEmpty()) {
                logger.warn("Missing issueKey in profit request");
                return ResponseEntity.badRequest().body(Map.of("error", "Missing issueKey"));
            }
            
            logger.info("Processing profit request for issueKey: {}", issueKey);
            
            // Initialize default values
            boolean hasSubmittedFinalQuote = false;
            Double totalProfit = null;
            
            try {
                // Check if final quote has been submitted by looking at proposals
                logger.info("Fetching proposals for issueKey: {}", issueKey);
                List<ContractProposal> proposals = contractProposalService.getProposalsForIssue(issueKey);
                logger.info("Found {} proposals for issueKey: {}", proposals.size(), issueKey);
                hasSubmittedFinalQuote = proposals.stream().anyMatch(p -> p.isFinal());
                logger.info("hasSubmittedFinalQuote: {} for issueKey: {}", hasSubmittedFinalQuote, issueKey);
                
                // Get the total profit field value directly from Jira
                logger.info("Calling JiraService to get field value for issueKey: {} and fieldId: {}", issueKey, jiraFieldConfig.getTotalprofit());
                String totalProfitStr = jiraService.getIssueFieldValue(issueKey, jiraFieldConfig.getTotalprofit());
                logger.info("Received totalProfitStr: '{}' for issueKey: {}", totalProfitStr, issueKey);
                if (totalProfitStr != null && !totalProfitStr.isEmpty()) {
                    try {
                        totalProfit = Double.parseDouble(totalProfitStr);
                        logger.info("Parsed totalProfit: {} for issueKey: {}", totalProfit, issueKey);
                    } catch (NumberFormatException e) {
                        logger.warn("Failed to parse total profit value '{}' for issueKey: {}", totalProfitStr, issueKey, e);
                    }
                } else {
                    logger.info("totalProfitStr is null or empty for issueKey: {}", issueKey);
                }
                
                logger.info("Successfully retrieved profit data for issueKey: {} - profit: {}, finalSubmitted: {}", 
                           issueKey, totalProfit, hasSubmittedFinalQuote);
            } catch (Exception e) {
                logger.warn("Failed to fetch profit data from Jira for issueKey: {}", issueKey, e);
                // Return default values instead of error to avoid breaking the UI
            }
            
            logger.info("Returning profit data for issueKey: {} - profit: {}, finalSubmitted: {}", 
                       issueKey, totalProfit, hasSubmittedFinalQuote);
            
            return ResponseEntity.ok(Map.of(
                "totalProfit", totalProfit,
                "hasSubmittedFinalQuote", hasSubmittedFinalQuote,
                "issueKey", issueKey
            ));
            
        } catch (Exception e) {
            logger.error("Error retrieving profit data for issueKey: {}", issueKey, e);
            // Return default values instead of error to avoid breaking the UI
            logger.info("Returning default values for issueKey: {} due to error", issueKey);
            return ResponseEntity.ok(Map.of(
                "totalProfit", null,
                "hasSubmittedFinalQuote", false,
                "issueKey", issueKey
            ));
        }
    }
    
   
@PostMapping("/contracts/save-attachment")
public ResponseEntity<?> saveAttachmentToContract(@RequestBody Map<String, Object> payload) {

    try {
        String issueKey = (String) payload.get("issueKey");
        
        // Extract fields directly from payload (not from metadata object)
        String fileName = payload.get("fileName") != null ? payload.get("fileName").toString() : "";
        String fileUrl = payload.get("fileUrl") != null ? payload.get("fileUrl").toString() : "";
        Long fileSize = payload.get("fileSize") != null ? Long.valueOf(payload.get("fileSize").toString()) : 0L;
        String mimeType = payload.get("mimeType") != null ? payload.get("mimeType").toString() : "";
        String uploadedBy = payload.get("uploadedBy") != null ? payload.get("uploadedBy").toString() : "system";
        String stage = payload.get("stage") != null ? payload.get("stage").toString() : "CREATION";
        Long proposalId = payload.get("proposalId") != null ? Long.valueOf(payload.get("proposalId").toString()) : null;
        
        // Removed fileContent processing since we're no longer storing attachment content in DB
        // Jira handles attachment storage

        logger.info("Saving attachment metadata in DB for issueKey={} file={}", issueKey, fileName);

        // Get proposal if proposalId is provided
        ContractProposal proposal = null;
        if (proposalId != null) {
            proposal = contractProposalRepository.findById(proposalId).orElse(null);
        }

        ContractAttachment attachment = new ContractAttachment();
        attachment.setContract(null);
        attachment.setProposal(proposal);
        attachment.setJiraIssueKey(issueKey);
        attachment.setFileName(fileName);
        attachment.setFileUrl(fileUrl);
        attachment.setFileSize(fileSize);
        attachment.setMimeType(mimeType);
        attachment.setUploadedBy(uploadedBy);
        attachment.setStage(stage);
        // Removed setting fileContent since we're not storing it anymore

        contractAttachmentRepository.save(attachment);

        return ResponseEntity.ok(Map.of("message", "Attachment metadata saved successfully"));

    } catch (Exception e) {
        logger.error("Failed saving attachment: ", e);
        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
    }
}


@PostMapping("/contracts/add-proposal")
public ResponseEntity<?> addProposal(@RequestBody Map<String, Object> payload) {

    try {
    	String issueKey = (String) payload.get("jiraIssueKey");

    	if (issueKey == null) {
    	    issueKey = (String) payload.get("issueKey"); // fallback
    	}
        Integer licenseCount = payload.get("licenseCount") != null
                ? Integer.valueOf(payload.get("licenseCount").toString()) : null;

        Double unitCost = payload.get("unitCost") != null
                ? Double.valueOf(payload.get("unitCost").toString()) : null;

        Double totalCost = payload.get("totalCost") != null
                ? Double.valueOf(payload.get("totalCost").toString())
                : (unitCost != null && licenseCount != null ? unitCost * licenseCount : null);

        String comment = (String) payload.get("comment");
        boolean isFinal = payload.get("isFinal") != null && (Boolean) payload.get("isFinal");

        // ❌ DO NOT CREATE CONTRACT HERE
        ContractDetails contract = contractDetailsRepository.findByJiraIssueKey(issueKey);
        // If null, keep null (contract is created only at COMPLETED status)

        ContractProposal last = contractProposalRepository
        		.findTopByJiraIssueKeyIgnoreCaseOrderByProposalNumberDesc(issueKey);


        int proposalNumber = last == null ? 1 : last.getProposalNumber() + 1;

        ContractProposal proposal = new ContractProposal();
        proposal.setContract(contract);  // can be null
        proposal.setJiraIssueKey(issueKey);
        proposal.setProposalNumber(proposalNumber);
        proposal.setLicenseCount(licenseCount);
        proposal.setUnitCost(unitCost);
        proposal.setTotalCost(totalCost);
        proposal.setComment(comment);
        proposal.setFinal(isFinal);
        proposal.setProposalType(isFinal ? "FINAL" : "PROPOSAL " + proposalNumber);

        contractProposalRepository.save(proposal);

        return ResponseEntity.ok(Map.of(
                "message", "Proposal saved",
                "proposalId", proposal.getId()
        ));

    } catch (Exception e) {
        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
    }
}

@GetMapping("/proposals/{proposalId}")
public ResponseEntity<?> getProposalById(@PathVariable Long proposalId) {
    try {
        ContractProposal proposal = contractProposalRepository.findById(proposalId)
                .orElse(null);

        if (proposal == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Proposal not found"));
        }

        // Return the proposal data in the format expected by the frontend
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("id", proposal.getId());
        responseData.put("jiraIssueKey", proposal.getJiraIssueKey());
        responseData.put("proposalNumber", proposal.getProposalNumber());
        responseData.put("proposalType", proposal.getProposalType());
        responseData.put("licenseCount", proposal.getLicenseCount());
        responseData.put("unitCost", proposal.getUnitCost());
        responseData.put("totalCost", proposal.getTotalCost());
        responseData.put("comment", proposal.getComment());
        responseData.put("final", proposal.isFinal());
        responseData.put("isFinalSubmitted", proposal.isFinalSubmitted());
        responseData.put("createdAt", proposal.getCreatedAt() != null ? proposal.getCreatedAt().toString() : null);
        return ResponseEntity.ok(responseData);

    } catch (Exception e) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", "Failed to fetch proposal: " + e.getMessage()));
    }
}


    @GetMapping("/contracts/proposals/{proposalId}/attachments")
    public ResponseEntity<?> getAttachmentsByProposalId(@PathVariable Long proposalId) {
        try {
            List<ContractAttachment> attachments = contractAttachmentService.getAttachmentsByProposalId(proposalId);
            return ResponseEntity.ok(attachments);
        } catch (Exception e) {
            logger.error("Error fetching attachments for proposal ID: {}", proposalId, e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch attachments: " + e.getMessage()));
        }
    }
    
    @GetMapping("/contracts/attachments/issue/{issueKey}")
    public ResponseEntity<?> getAttachmentsByIssueKey(@PathVariable String issueKey) {
        try {
            List<ContractAttachment> attachments = contractAttachmentService.getAttachmentsByIssueKey(issueKey);
            return ResponseEntity.ok(attachments);
        } catch (Exception e) {
            logger.error("Error fetching attachments for issue key: {}", issueKey, e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch attachments: " + e.getMessage()));
        }
    }
    
    /**
     * Serve attachment file content
     * @param attachmentId The attachment ID
     * @return The attachment file content
     */
    @GetMapping("/contracts/attachments/{attachmentId}/content")
    public ResponseEntity<?> getAttachmentContent(@PathVariable Long attachmentId) {
        try {
            ContractAttachment attachment = contractAttachmentRepository.findById(attachmentId)
                    .orElse(null);
            
            if (attachment == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Since we no longer store file content locally, redirect to Jira for the attachment
            // Extract Jira attachment URL from our fileUrl
            String fileUrl = attachment.getFileUrl();
            if (fileUrl != null && !fileUrl.isEmpty()) {
                // Redirect to the Jira attachment URL
                return ResponseEntity.status(HttpStatus.FOUND)
                        .header(HttpHeaders.LOCATION, fileUrl)
                        .build();
            } else {
                // If we don't have a file URL, return not found
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error serving attachment content for ID: {}", attachmentId, e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to serve attachment: " + e.getMessage()));
        }
    }
    
    @PostMapping("/vendors")
	public ResponseEntity<VendorDetailsDTO> createVendor(@RequestBody VendorDetailsDTO dto) {
		VendorDetailsDTO created = vendorDetailsService.createVendor(dto);
		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}

	// -------------------- DELETE VENDOR PRODUCT (BY ID) --------------------
	@DeleteMapping("/vendors/{id}")
	public ResponseEntity<Void> deleteVendorProduct(@PathVariable Long id) {
		boolean deleted = vendorDetailsService.deleteVendorById(id);
		if (!deleted) {
			return ResponseEntity.notFound().build(); // 404 if id doesn't exist
		}
		return ResponseEntity.noContent().build(); // 204 on success
	}

	/**
     * Update license count and total profit for a contract
     * @param payload Request payload containing issueKey, newLicenseCount, and totalProfit
     * @return Response indicating success or failure
     */
    @PostMapping("/contracts/update-license-count")
    public ResponseEntity<?> updateLicenseCount(@RequestBody Map<String, Object> payload) {
        try {
            logger.info("Received request to update license count with payload: {}", payload);
            
            // Extract required fields from payload
            String issueKey = (String) payload.get("issueKey");
            Object licenseCountObj = payload.get("newLicenseCount");
            Object totalProfitObj = payload.get("totalProfit");
            
            // Validate required fields
            if (issueKey == null || issueKey.isEmpty()) {
                logger.warn("Missing issueKey in update license count request");
                return ResponseEntity.badRequest().body(Map.of("error", "Missing issueKey"));
            }
            
            // Convert license count to Integer
            Integer newLicenseCount = null;
            if (licenseCountObj != null) {
                if (licenseCountObj instanceof Number) {
                    newLicenseCount = ((Number) licenseCountObj).intValue();
                } else if (licenseCountObj instanceof String) {
                    try {
                        newLicenseCount = Integer.parseInt((String) licenseCountObj);
                    } catch (NumberFormatException e) {
                        logger.warn("Invalid license count format: {}", licenseCountObj);
                        return ResponseEntity.badRequest().body(Map.of("error", "Invalid license count format"));
                    }
                }
            }
            
            // Convert total profit to Double (optional)
            Double totalProfit = null;
            if (totalProfitObj != null) {
                if (totalProfitObj instanceof Number) {
                    totalProfit = ((Number) totalProfitObj).doubleValue();
                } else if (totalProfitObj instanceof String) {
                    try {
                        totalProfit = Double.parseDouble((String) totalProfitObj);
                    } catch (NumberFormatException e) {
                        logger.warn("Invalid total profit format: {}", totalProfitObj);
                        // Don't fail the request for invalid profit, just ignore it
                    }
                }
            }
            
            // Update the license count and profit
            ContractDetails updatedContract = contractDetailsService.updateLicenseCountAndProfit(
                issueKey, newLicenseCount, totalProfit);
            
            logger.info("Successfully updated license count for issueKey: {}", issueKey);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "License count updated successfully");
            if (updatedContract.getId() != null) {
                response.put("contractId", updatedContract.getId());
            } else {
                response.put("issueKey", updatedContract.getJiraIssueKey());
            }
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error updating license count", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to update license count");
            errorResponse.put("message", e.getMessage() != null ? e.getMessage() : "Unknown error occurred");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * Finalize contract submission for an issue
     * @param issueKey The Jira issue key
     * @return Success or error response
     */
    @PostMapping("/contracts/final-submit/{issueKey}")
    public ResponseEntity<?> finalSubmitContract(@PathVariable String issueKey) {
        try {
            logger.info("Received request to finalize contract submission for issueKey: {}", issueKey);
            
            // Validate required fields
            if (issueKey == null || issueKey.isEmpty()) {
                logger.warn("Missing issueKey in final submit request");
                return ResponseEntity.badRequest().body(Map.of("error", "Missing issueKey"));
            }
            
            // Calculate total profit before marking as submitted
            Double totalProfit = contractProposalService.calculateTotalProfit(issueKey);
            
            // Update the total profit in Jira
            if (totalProfit != null) {
                try {
                    // Update the contract with the calculated profit
                    contractDetailsService.updateLicenseCountAndProfit(issueKey, null, totalProfit);
                } catch (Exception e) {
                    logger.warn("Failed to update total profit for issueKey: {}", issueKey, e);
                }
            }
            
            // Mark the contract as having a submitted final quote
            ContractDetails updatedContract = contractDetailsService.markFinalQuoteSubmitted(issueKey);
            
            logger.info("Successfully finalized contract submission for issueKey: {}", issueKey);
            return ResponseEntity.ok(Map.of(
                "message", "Contract finalized successfully",
                "issueKey", issueKey,
                "contractId", updatedContract.getId(),
                "totalProfit", totalProfit
            ));
            
        } catch (Exception e) {
            logger.error("Error finalizing contract submission for issueKey: {}", issueKey, e);
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to finalize contract submission",
                "message", e.getMessage()
            ));
        }
    }
}
