package com.htc.productdevelopment.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.htc.productdevelopment.model.JiraProject;
import com.htc.productdevelopment.service.JiraService;
import com.htc.productdevelopment.service.ContractDetailsService;
import com.htc.productdevelopment.service.VendorDetailsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;


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
    private final ContractDetailsService contractDetailsService;
    private final VendorDetailsService vendorDetailsService;

    public JiraController(JiraService jiraService,
                          ContractDetailsService contractDetailsService,
                          VendorDetailsService vendorDetailsService) {
        this.jiraService = jiraService;
        this.contractDetailsService = contractDetailsService;
        this.vendorDetailsService = vendorDetailsService;
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
     * Get all issues across all projects
     * @return All issues from all projects
     */
    @GetMapping("/issues")
    public ResponseEntity<?> getAllIssues() {
        try {
            logger.info("Received request for all issues across all projects");
            JsonNode allIssues = jiraService.getAllIssues();
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
    @PostMapping("/issues/{issueIdOrKey}/attachments")
    public ResponseEntity<?> addAttachmentToIssue(@PathVariable String issueIdOrKey, @RequestParam("file") MultipartFile file) {
        try {
            logger.info("Received request to add attachment to Jira issue: {}", issueIdOrKey);
            byte[] fileContent = file.getBytes();
            String fileName = file.getOriginalFilename();
            
            // ✅ Use Jira Cloud version that includes X-Atlassian-Token
            JsonNode response = jiraService.addAttachmentToIssueJira(issueIdOrKey, fileContent, fileName);
            
            logger.info("Attachment added successfully to issue: {}", issueIdOrKey);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error adding attachment to Jira issue: {}", issueIdOrKey, e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to add attachment: " + e.getMessage()));
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
 
 // 3️⃣ Fetch product type for a given vendor and product
 @GetMapping("/vendors/{vendorName}/products/{productName}/type")
 public ResponseEntity<?> getProductType(@PathVariable String vendorName, @PathVariable String productName) {
     try {
         logger.info("Fetching product type for vendor: {}, product: {}", vendorName, productName);
         String productType = vendorDetailsService.getProductType(vendorName, productName);
         return ResponseEntity.ok(Map.of("productType", productType != null ? productType : "unknown"));
     } catch (Exception e) {
         return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch product type: " + e.getMessage()));
     }
 }
 
 // 4️⃣ Fetch products of a specific type for a given vendor
 @GetMapping("/vendors/{vendorName}/products/type/{productType}")
 public ResponseEntity<?> getVendorProductsByType(@PathVariable String vendorName, @PathVariable String productType) {
     try {
         logger.info("Fetching {} products for vendor: {}", productType, vendorName);
         return ResponseEntity.ok(vendorDetailsService.getProductsByVendorAndType(vendorName, productType));
     } catch (Exception e) {
         return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch products: " + e.getMessage()));
     }
 }

 // -------------------------------------------------------------------------
 // 📄 Contract Details Endpoints
 // -------------------------------------------------------------------------
 
 // 5️⃣ Fetch contract details for a given vendor
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
 
 @GetMapping("/issues/{issueIdOrKey}/statuses")
 public ResponseEntity<?> getIssueStatuses(@PathVariable String issueIdOrKey) {
     try {
         logger.info("Received request for statuses of issue: {}", issueIdOrKey);
         JsonNode statuses = jiraService.getIssueStatuses(issueIdOrKey);
         return ResponseEntity.ok(statuses);
     } catch (Exception e) {
         logger.error("Error fetching statuses for issue {}", issueIdOrKey, e);
         return ResponseEntity.internalServerError()
                 .body(Map.of("message", "Failed to fetch statuses: " + e.getMessage()));
     }
 }


}