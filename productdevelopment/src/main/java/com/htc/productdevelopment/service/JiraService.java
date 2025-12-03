package com.htc.productdevelopment.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.htc.productdevelopment.config.JiraConfig;
import org.springframework.context.annotation.Lazy;
import com.htc.productdevelopment.model.ContractDetails;
import com.htc.productdevelopment.model.JiraProject;
import com.htc.productdevelopment.model.Organization;
import com.htc.productdevelopment.model.Department;
import com.htc.productdevelopment.repository.ContractDetailsRepository;
import com.htc.productdevelopment.repository.DepartmentRepository;
import com.htc.productdevelopment.service.ContractDetailsService;
import com.htc.productdevelopment.service.OrganizationService;
import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpMethod;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import com.htc.productdevelopment.config.JiraFieldConfig;
import com.htc.productdevelopment.dto.ContractDTO;
import com.fasterxml.jackson.databind.node.ObjectNode;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
//import org.json.JSONArray;
//import org.json.JSONObject;
 
//import okhttp3.MediaType;
//import okhttp3.OkHttpClient;
//import okhttp3.Request;
//import okhttp3.RequestBody;
//import okhttp3.Response;
// 

/**
 * Service class for handling Jira API operations
 * This service provides methods for interacting with the Jira REST API
 */
@Service
public class JiraService {

    // Logger for tracking service operations
    private static final Logger logger = LoggerFactory.getLogger(JiraService.class);
    
    // Configuration for Jira API connection
    private final JiraConfig jiraConfig;
    
    // HTTP client for making API calls
    private final RestTemplate restTemplate;
    
    @Autowired
    private ContractDetailsRepository contractDetailsRepository;
    
    @Autowired
    @Lazy
    private ContractDetailsService contractDetailsService;
    
    @Autowired
    private JiraFieldConfig jiraFieldConfig;
    
    @Autowired
    private OrganizationService organizationService;
    
    @Autowired
    private DepartmentRepository departmentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // JSON parser for handling API responses
    private final ObjectMapper objectMapper;

    // Add getter for jiraConfig
    public JiraConfig getJiraConfig() {
        return jiraConfig;
    }
    
    /**
     * Constructor to initialize dependencies
     * @param jiraConfig Configuration for Jira API connection
     * @param restTemplate HTTP client for making API calls
     * @param objectMapper JSON parser for handling API responses
     */
    public JiraService(JiraConfig jiraConfig, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.jiraConfig = jiraConfig;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }
    
    public String getAuthHeader() {
        String auth = jiraConfig.getEmail() + ":" + jiraConfig.getApiToken();
        String encoded = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
        return "Basic " + encoded;
    }
    
    
    /**
     * Get recent Jira projects (max 3)
     * @return List of recent Jira projects
     */
    public List<JiraProject> getRecentProjects() {
        try {
            logger.info("Fetching recent Jira projects");
            
            // Build the API URL for getting projects with a limit of 3
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/project/recent?maxResults=3";
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            
            // Parse the response and create project objects
            List<JiraProject> projects = parseProjectsResponse(response);
            
            // Ensure we don't return more than 3 projects
            if (projects.size() > 3) {
                projects = projects.subList(0, 3);
            }
            
            logger.info("Successfully fetched {} recent projects", projects.size());
            return projects;
        } catch (Exception e) {
            logger.error("Error fetching recent Jira projects", e);
            return List.of(); // Return empty list on error
        }
    }

    /**
     * Get all Jira projects
     * @return List of all Jira projects
     */
    public List<JiraProject> getAllProjects() {
        try {
            logger.info("Fetching all Jira projects");
            
            // Build the API URL for getting projects
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/project";
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            
            // Parse the response and create project objects
            List<JiraProject> projects = parseProjectsResponse(response);
            
            logger.info("Successfully fetched {} projects", projects.size());
            return projects;
        } catch (Exception e) {
            logger.error("Error fetching all Jira projects", e);
            return List.of(); // Return empty list on error
        }
    }

    /**
     * Parse projects response from Jira API
     * @param response The JSON response from Jira API
     * @return List of JiraProject objects
     */
    private List<JiraProject> parseProjectsResponse(JsonNode response) {
        try {
            // Create a list to hold the projects
            List<JiraProject> projects = new java.util.ArrayList<>();
            
            // Iterate through the projects in the response
            if (response.isArray()) {
                for (JsonNode projectNode : response) {
                    // Create a new project object and populate its fields
                    JiraProject project = new JiraProject();
                    project.setProjectId(getTextValue(projectNode, "id"));
                    project.setKey(getTextValue(projectNode, "key"));
                    project.setName(getTextValue(projectNode, "name"));
                    project.setDescription(getTextValue(projectNode, "description"));
                    project.setProjectTypeKey(getTextValue(projectNode, "projectTypeKey"));
                    
                    // Extract project lead information if available
                    JsonNode leadNode = projectNode.get("lead");
                    if (leadNode != null) {
                        String leadName = getTextValue(leadNode, "displayName");
                        project.setLead(leadName);
                    } else {
                        project.setLead(null);
                    }
                    
                    projects.add(project);
                }
            }
            
            return projects;
        } catch (Exception e) {
            logger.error("Error parsing projects response", e);
            return List.of();
        }
    }
    
    public JsonNode getRequestManagementProject() {
        String projectKey = jiraConfig.getContractProjectKey(); // We’ll create getter
        String url = jiraConfig.getBaseUrl() + "/rest/api/3/project/" + projectKey;

        HttpHeaders headers = createAuthHeaders();
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(
            url, HttpMethod.GET, entity, String.class
        );

        ObjectMapper mapper = new ObjectMapper();
        try {
            return mapper.readTree(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Request Management project details", e);
        }
    }

    
    private HttpHeaders createAuthHeaders() {
        String auth = jiraConfig.getEmail() + ":" + jiraConfig.getApiToken();
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encodedAuth);
        headers.set("Accept", "application/json");
        headers.set("Content-Type", "application/json");

        return headers;
    }
    

    /**
     * Get a specific Jira project by ID or key
     * @param projectIdOrKey The project ID or key
     * @return JiraProject containing the project details
     * @throws Exception if the API call fails
     */
    public JiraProject getProjectByIdOrKey(String projectIdOrKey) throws Exception {
        try {
            logger.info("Fetching Jira project with ID/Key: {}", projectIdOrKey);
            
            // Build the API URL for getting a specific project
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/project/" + projectIdOrKey;
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            
            // Create a new project object and populate its fields
            JiraProject project = new JiraProject();
            project.setProjectId(getTextValue(response, "id"));
            project.setKey(getTextValue(response, "key"));
            project.setName(getTextValue(response, "name"));
            project.setDescription(getTextValue(response, "description"));
            project.setProjectTypeKey(getTextValue(response, "projectTypeKey"));
            
            // Extract project lead information if available
            JsonNode leadNode = response.get("lead");
            if (leadNode != null) {
                String leadName = getTextValue(leadNode, "displayName");
                project.setLead(leadName);
            } else {
                project.setLead(null);
            }
            
            logger.info("Project fetched successfully: {}", project.getKey());
            return project;
        } catch (Exception e) {
            logger.error("Error fetching Jira project with ID/Key: {}", projectIdOrKey, e);
            // Provide more detailed error information
            throw new Exception("Failed to fetch Jira project '" + projectIdOrKey + "': " + e.getMessage(), e);
        }
    }

    /**
     * Get all issues across all projects
     * @return JsonNode containing all issues
     * @throws Exception if the API call fails
     */
    public JsonNode getAllIssues(String userRole, Long userOrganizationId, Long userDepartmentId, String userEmail)
 throws Exception {
        try {
            logger.info("Fetching all issues across all projects with user context - Role: {}, Organization ID: {}, Department ID: {}", 
                userRole, userOrganizationId, userDepartmentId);
            
            // Add detailed logging for debugging
            logger.info("=== DEBUG INFO ===");
            logger.info("User Role: {}", userRole);
            logger.info("User Organization ID: {}", userOrganizationId);
            logger.info("User Department ID: {}", userDepartmentId);
            
            // Build the API URL for searching all issues using the new JQL endpoint
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/search/jql";
            
            // Create the base JQL query
            StringBuilder jqlBuilder = new StringBuilder("project = \"Request Management\"");
            
            // Convert organization and department IDs to names if they exist
            String organizationName = null;
            String departmentName = null;
            
            if (userOrganizationId != null) {
                try {
                    Organization org = organizationService.getOrganizationById(userOrganizationId)
                            .orElse(null);
                    if (org != null) {
                        organizationName = org.getName();
                        logger.info("Resolved organization ID {} to name: {}", userOrganizationId, organizationName);
                    } else {
                        logger.warn("Organization not found for ID: {}", userOrganizationId);
                    }
                } catch (Exception e) {
                    logger.warn("Failed to resolve organization ID {}: {}", userOrganizationId, e.getMessage());
                }
            }
            
            if (userDepartmentId != null) {
                try {
                    Department dept = departmentRepository.findById(userDepartmentId)
                            .orElse(null);
                    if (dept != null) {
                        departmentName = dept.getName();
                        logger.info("Resolved department ID {} to name: {}", userDepartmentId, departmentName);
                    } else {
                        logger.warn("Department not found for ID: {}", userDepartmentId);
                    }
                } catch (Exception e) {
                    logger.warn("Failed to resolve department ID {}: {}", userDepartmentId, e.getMessage());
                }
            }
            
            logger.info("Organization Name: {}", organizationName);
            logger.info("Department Name: {}", departmentName);
            
            // Apply filtering based on user role
         // Apply filtering based on user role
            if (userRole != null) {

                String orgField = jiraFieldConfig.getOrganizationName();   // "Organization"
                String deptField = jiraFieldConfig.getDepartmentName();    // "Department"

                switch (userRole) {

                    case "SUPER_ADMIN":
                        logger.info("SUPER_ADMIN → No filtering");
                        break;

                    case "ADMIN":
                    case "APPROVER":
                        logger.info("ADMIN/APPROVER → Filter by org + dept");

                        if (organizationName != null)
                            jqlBuilder.append(" AND \"").append(orgField).append("\" = \"").append(organizationName).append("\"");

                        if (departmentName != null)
                            jqlBuilder.append(" AND \"").append(deptField).append("\" = \"").append(departmentName).append("\"");

                        break;

                    case "REQUESTER":
                        logger.info("REQUESTER → Filter by Org + Dept + Requester Email");

                        if (organizationName != null)
                            jqlBuilder.append(" AND \"").append(orgField).append("\" = \"").append(organizationName).append("\"");

                        if (departmentName != null)
                            jqlBuilder.append(" AND \"").append(deptField).append("\" = \"").append(departmentName).append("\"");

                        // 🔥 Add requester email filter (mandatory for requester role)
                        String requesterEmailField = jiraFieldConfig.getRequesterEmail();

                        User requesterUser = null;
                        if (userEmail != null) {
                            requesterUser = userRepository.findByEmail(userEmail).orElse(null);
                        }

                        if (requesterUser != null && requesterUser.getEmail() != null) {
                            jqlBuilder.append(" AND \"")
                                      .append(requesterEmailField)
                                      .append("\" = \"")
                                      .append(requesterUser.getEmail())
                                      .append("\"");
                        }



                    default:
                        logger.warn("Unknown role → basic filtering");
                        if (organizationName != null)
                            jqlBuilder.append(" AND \"").append(orgField).append("\" = \"").append(organizationName).append("\"");
                        if (departmentName != null)
                            jqlBuilder.append(" AND \"").append(deptField).append("\" = \"").append(departmentName).append("\"");
                }
            
        
            } else {
                logger.warn("User role is null, applying default filtering");
                // If no user role, apply basic filtering if org/dept are available
                if (organizationName != null && departmentName != null) {
                    jqlBuilder.append(" AND \"").append(jiraFieldConfig.getOrganization()).append("\" = \"").append(organizationName).append("\"");
                    jqlBuilder.append(" AND \"").append(jiraFieldConfig.getDepartment()).append("\" = \"").append(departmentName).append("\"");
                } else if (organizationName != null) {
                    jqlBuilder.append(" AND \"").append(jiraFieldConfig.getOrganization()).append("\" = \"").append(organizationName).append("\"");
                }
            }
            
            jqlBuilder.append(" ORDER BY key DESC");
            
            logger.info("Final JQL query: {}", jqlBuilder.toString());
            
            // Create the request body with JQL and fields
            Map<String, Object> requestBody = Map.of(
                "jql", jqlBuilder.toString(),
                "maxResults", 1000,
                "fields", List.of(
                    "*all",

                    "summary",
                    "project",
                    "assignee",
                    "issuetype",
                    "status",
                    "priority",
                    "created",
                    "updated",
                    "reporter",
                    "description",
                    "duedate",

                    // --- Contract custom fields ---
                    jiraFieldConfig.getVendorName(),
                    jiraFieldConfig.getProductName(),
                    jiraFieldConfig.getBillingType(),
                    jiraFieldConfig.getContractType(),
                    jiraFieldConfig.getRequesterName(),
                    jiraFieldConfig.getRequesterEmail(),
                    jiraFieldConfig.getDepartment(),
                    jiraFieldConfig.getAdditionalComment(),
                    jiraFieldConfig.getDueDate(),
                    jiraFieldConfig.getRenewalDate(),

                    jiraFieldConfig.getCurrentLicenseCount(),
                    jiraFieldConfig.getCurrentUsageCount(),
                    jiraFieldConfig.getCurrentUnit(),

                    jiraFieldConfig.getNewLicenseCount(),
                    jiraFieldConfig.getNewUsageCount(),
                    jiraFieldConfig.getNewUnit(),

                    jiraFieldConfig.getLicenseUpdateType(),
                    jiraFieldConfig.getExistingContractId(),
                    jiraFieldConfig.getOrganization() // Include organization field
                )

            );
            
            // Make the API call with POST method
            JsonNode response = makeJiraApiCall(url, HttpMethod.POST, requestBody);
            
            logger.info("Successfully fetched all issues");
            return response;
        } catch (Exception e) {
            logger.error("Error fetching all issues", e);
            throw e;
        }
    }
    
    // Keep the original method for backward compatibility
    public JsonNode getAllIssues() throws Exception {
        return getAllIssues(null, null, null, null);
    }

    /**
     * Get recent issues across all projects (max 3)
     * @return JsonNode containing recent issues
     * @throws Exception if the API call fails
     */
    public JsonNode getRecentIssues() throws Exception {
        try {
            logger.info("Fetching recent issues across all projects");
            
            // Build the API URL for searching recent issues using the new JQL endpoint
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/search/jql";
            
            // Create the JQL query to get recent issues with a limit of 3
            // Using "project is not EMPTY" as a search restriction to avoid unbounded queries
            // Order by created date descending to get the most recent issues
            // Include all the fields we need for the frontend, including custom fields
            Map<String, Object> requestBody = Map.of(
                "jql", "project is not EMPTY ORDER BY created DESC",
                "maxResults", 3,
                "fields", List.of(
                    "summary", 
                    "project", 
                    "assignee", 
                    "issuetype", 
                    "status", 
                    "priority", 
                    "created", 
                    "updated", 
                    "reporter",
                    "description",
                    "customfield_10200", 
                    "customfield_10201",
                    "labels",
                    "components",
                    "versions",
                    "fixVersions",
                    "environment",
                    "duedate",
                    "timetracking"
                )
            );
            
            // Make the API call with POST method
            JsonNode response = makeJiraApiCall(url, HttpMethod.POST, requestBody);
            
            logger.info("Successfully fetched recent issues");
            return response;
        } catch (Exception e) {
            logger.error("Error fetching recent issues", e);
            throw e;
        }
    }

    /**
     * Get issues for a specific Jira project
     * @param projectKey The project key
     * @return JsonNode containing the response
     * @throws Exception if the API call fails
     */
    public JsonNode getIssuesForProject(String projectKey) throws Exception {
        try {
            logger.info("Fetching issues for project key: {}", projectKey);
            
            // Build the API URL for searching issues in a specific project using the new JQL endpoint
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/search/jql";
            
            // Create the JQL query with proper formatting
            Map<String, Object> requestBody = Map.of(
                "jql", "project = \"" + projectKey + "\"",
                "maxResults", 1000,
                "fields", List.of(
                	    "*all",

                	    "summary",
                	    "project",
                	    "assignee",
                	    "issuetype",
                	    "status",
                	    "priority",
                	    "created",
                	    "updated",
                	    "reporter",
                	    "description",
                	    "duedate",

                	    // --- Contract custom fields ---
                	    jiraFieldConfig.getVendorName(),
                	    jiraFieldConfig.getProductName(),
                	    jiraFieldConfig.getBillingType(),
                	    jiraFieldConfig.getContractType(),
                	    jiraFieldConfig.getRequesterName(),
                	    jiraFieldConfig.getRequesterEmail(),
                	    jiraFieldConfig.getDepartment(),
                	    jiraFieldConfig.getAdditionalComment(),
                	    jiraFieldConfig.getDueDate(),
                	    jiraFieldConfig.getRenewalDate(),

                	    jiraFieldConfig.getCurrentLicenseCount(),
                	    jiraFieldConfig.getCurrentUsageCount(),
                	    jiraFieldConfig.getCurrentUnit(),

                	    jiraFieldConfig.getNewLicenseCount(),
                	    jiraFieldConfig.getNewUsageCount(),
                	    jiraFieldConfig.getNewUnit(),

                	    jiraFieldConfig.getLicenseUpdateType(),
                	    jiraFieldConfig.getExistingContractId(),
                	    jiraFieldConfig.getOrganization(),
                	    jiraFieldConfig.getDepartment()
                	    
)
            );
            
            // Make the API call with POST method
            JsonNode response = makeJiraApiCall(url, HttpMethod.POST, requestBody);
            
            logger.info("Successfully fetched issues for project: {}", projectKey);
            return response;
        } catch (Exception e) {
            logger.error("Error fetching issues for project: {}", projectKey, e);
            throw e;
        }
    }

    /**
     * Get all fields from Jira
     * @return List of fields from Jira
     * @throws Exception if the API call fails
     */
    public JsonNode getFields() throws Exception {
        try {
            logger.info("Fetching fields from Jira");
            
            // Build the API URL for getting fields
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/field";
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            logger.info("Fields fetched successfully");
            
            return response;
        } catch (Exception e) {
            logger.error("Error fetching fields from Jira", e);
            // Provide more detailed error information
            throw new Exception("Failed to fetch fields: " + e.getMessage(), e);
        }
    }

    /**
     * Test connectivity to Jira API
     * @return true if connectivity is successful, false otherwise
     * @throws Exception if the API call fails
     */
    public boolean testJiraConnectivity() throws Exception {
        try {
            logger.info("Testing connectivity to Jira API at: {}", jiraConfig.getBaseUrl());
            logger.info("Using email: {}", jiraConfig.getEmail());
            logger.info("API token length: {}", jiraConfig.getApiToken() != null ? jiraConfig.getApiToken().length() : 0);
            
            // Build the API URL for testing connectivity
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/serverInfo";
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            logger.info("Connectivity test successful. Server info: {}", response);
            
            return true;
        } catch (Exception e) {
            logger.error("Connectivity test failed", e);
            throw e;
        }
    }
    
    /**
     * Get all issue types from Jira
     * @return List of issue types from Jira
     * @throws Exception if the API call fails
     */
    public JsonNode getIssueTypes() throws Exception {
        try {
            logger.info("Fetching issue types from Jira");
            
            // Build the API URL for getting issue types
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/issuetype";
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            logger.info("Issue types fetched successfully");
            
            return response;
        } catch (Exception e) {
            logger.error("Error fetching issue types from Jira", e);
            // Provide more detailed error information
            throw new Exception("Failed to fetch issue types: " + e.getMessage(), e);
        }
    }

    /**
     * Get users assignable to issues in a project
     * @param projectKey The project key
     * @return List of assignable users
     * @throws Exception if the API call fails
     */
    public JsonNode getAssignableUsers(String projectKey) throws Exception {
        try {
            logger.info("Fetching assignable users for project: {}", projectKey);
            
            // Build the API URL for getting assignable users
            String url = UriComponentsBuilder.fromHttpUrl(jiraConfig.getBaseUrl())
                .path("/rest/api/3/user/assignable/search")
                .queryParam("project", projectKey)
                .toUriString();
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            logger.info("Assignable users fetched successfully for project: {}", projectKey);
            
            return response;
        } catch (Exception e) {
            logger.error("Error fetching assignable users for project: {}", projectKey, e);
            throw e;
        }
    }

    /**
     * Create a new Jira issue
     * @param issueData The issue data to create
     * @return JsonNode containing the response
     * @throws Exception if the API call fails
     */
    public JsonNode createIssue(Map<String, Object> issueData) throws Exception {
        try {
            logger.info("Creating new Jira issue with data: {}", issueData);
            
            // Build the API URL for creating an issue
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/issue";
            logger.info("Jira API URL: {}", url);
            
            // Prepare the request body for Jira API
            Map<String, Object> fields = new HashMap<>();
            
            // Add project
            if (issueData.get("project") != null) {
                fields.put("project", Map.of("key", issueData.get("project")));
            } else {
                logger.warn("Project key is missing from issue data");
                throw new IllegalArgumentException("Project key is required");
            }
            
            // Add issue type
            if (issueData.get("issueType") != null) {
                fields.put("issuetype", Map.of("name", issueData.get("issueType")));
            } else {
                logger.warn("Issue type is missing from issue data");
                throw new IllegalArgumentException("Issue type is required");
            }
            
            // Add summary
            if (issueData.get("summary") != null) {
                fields.put("summary", issueData.get("summary"));
            } else {
                logger.warn("Summary is missing from issue data");
                throw new IllegalArgumentException("Summary is required");
            }
            
            // Add description if provided in Atlassian Document Format
            if (issueData.get("description") != null && !((String) issueData.get("description")).isEmpty()) {
                fields.put("description", createAtlassianDocumentFormat((String) issueData.get("description")));
            }
            
            // Add due date if provided
            if (issueData.get("dueDate") != null && !((String) issueData.get("dueDate")).isEmpty()) {
                fields.put("duedate", issueData.get("dueDate"));
            }
            
            // Note: Custom fields (customfield_10200, customfield_10201) are not included in issue creation
            // as they may not be available on the creation screen in Jira.
            // These fields can be updated after issue creation if needed.
            
            Map<String, Object> requestBody = Map.of("fields", fields);
            logger.info("Prepared request body for Jira API: {}", requestBody);
            
            // Make the API call to create the issue
            logger.info("Making API call to create issue...");
            JsonNode response = makeJiraApiCall(url, HttpMethod.POST, requestBody);
            logger.info("Issue created successfully with response: {}", response);
            
            // If custom fields are provided, update the issue with them
            try {
                String issueKey = response.get("key").asText();
                if ((issueData.get("assigneeCustom") != null && !((String) issueData.get("assigneeCustom")).isEmpty()) ||
                    (issueData.get("reporterCustom") != null && !((String) issueData.get("reporterCustom")).isEmpty())) {
                    
                    Map<String, Object> updateFields = new HashMap<>();
                    
                    // Add assignee using hardcoded custom field (customfield_10200)
                    if (issueData.get("assigneeCustom") != null && !((String) issueData.get("assigneeCustom")).isEmpty()) {
                        updateFields.put("customfield_10200", issueData.get("assigneeCustom"));
                    }
                    
                    // Add reporter using hardcoded custom field (customfield_10201)
                    if (issueData.get("reporterCustom") != null && !((String) issueData.get("reporterCustom")).isEmpty()) {
                        updateFields.put("customfield_10201", issueData.get("reporterCustom"));
                    }
                    
                    // Update the issue with custom fields
                    if (!updateFields.isEmpty()) {
                        logger.info("Updating issue {} with custom fields: {}", issueKey, updateFields);
                        updateIssue(issueKey, updateFields);
                    }
                }
            } catch (Exception e) {
                logger.warn("Failed to update custom fields for issue, but issue was created successfully", e);
            }
            
            return response;
        } catch (Exception e) {
            logger.error("Error creating Jira issue with data: {}", issueData, e);
            throw new Exception("Failed to create Jira issue: " + e.getMessage(), e);
        }
    }
    
    /**
     * Update an existing Jira issue
     * @param issueKey The issue key to update
     * @param fields The fields to update
     * @return JsonNode containing the response
     * @throws Exception if the API call fails
     */
    public JsonNode updateIssue(String issueKey, Map<String, Object> fields) throws Exception {
        try {
            logger.info("Updating Jira issue: {}", issueKey);
            
            // Build the API URL for updating an issue
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/issue/" + issueKey;
            
            // Map our field names to Jira's expected field names
            Map<String, Object> jiraFields = new HashMap<>();
            
            // Handle issue type
            if (fields.containsKey("issueType") && fields.get("issueType") != null) {
                jiraFields.put("issuetype", Map.of("name", fields.get("issueType")));
            }
            
            // Handle summary
            if (fields.containsKey("summary") && fields.get("summary") != null) {
                jiraFields.put("summary", fields.get("summary"));
            }
            
            // Handle project
            if (fields.containsKey("project") && fields.get("project") != null) {
                jiraFields.put("project", Map.of("key", fields.get("project")));
            }
            
            // Handle description
            if (fields.containsKey("description") && fields.get("description") != null) {
                Object descObj = fields.get("description");
                String descriptionText;

                if (descObj instanceof Map) {
                    // Convert LinkedHashMap to JSON string (if frontend sends structured ADF)
                    descriptionText = objectMapper.writeValueAsString(descObj);
                } else {
                    descriptionText = descObj.toString();
                }

                jiraFields.put("description", createAtlassianDocumentFormat(descriptionText));
            }

            
            // Handle due date - only send if not empty
            if (fields.containsKey("dueDate") && fields.get("dueDate") != null && !fields.get("dueDate").toString().isEmpty()) {
                jiraFields.put("duedate", fields.get("dueDate"));
            }
            
            // Handle custom fields (these are the actual Jira custom field IDs)
            if (fields.containsKey("assigneeCustom") && fields.get("assigneeCustom") != null && !fields.get("assigneeCustom").toString().isEmpty()) {
                jiraFields.put("customfield_10200", fields.get("assigneeCustom"));
            }
            
            if (fields.containsKey("reporterCustom") && fields.get("reporterCustom") != null && !fields.get("reporterCustom").toString().isEmpty()) {
                jiraFields.put("customfield_10201", fields.get("reporterCustom"));
            }
            
            // Handle any other custom fields that are passed in
            for (Map.Entry<String, Object> entry : fields.entrySet()) {
                String key = entry.getKey();
                Object value = entry.getValue();
                
                // Check if the key starts with "customfield_"
                if (key.startsWith("customfield_") && value != null && !value.toString().isEmpty()) {
                    // Don't override the hardcoded custom fields we already handled
                    if (!key.equals("customfield_10200") && !key.equals("customfield_10201")) {
                        jiraFields.put(key, value);
                    }
                }
            }
            
            Map<String, Object> requestBody = Map.of("fields", jiraFields);
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.PUT, requestBody);
            logger.info("Issue updated successfully: {}", issueKey);
            
            return response;
        } catch (Exception e) {
            logger.error("Error updating Jira issue: {}", issueKey, e);
            throw e;
        }
    }

    /**
     * Create Atlassian Document Format structure for description
     * @param text The plain text description
     * @return Map representing the ADF structure
     */
    private Map<String, Object> createAtlassianDocumentFormat(String text) {
        try {
            // If text is already a valid JSON ADF string, return it parsed
            if (text != null && text.trim().startsWith("{")) {
                JsonNode node = objectMapper.readTree(text);
                if (node.has("type") && "doc".equals(node.get("type").asText())) {
                    return objectMapper.convertValue(node, Map.class);
                }
            }
        } catch (Exception ignored) {}

        Map<String, Object> content = new HashMap<>();
        content.put("type", "doc");
        content.put("version", 1);

        Map<String, Object> paragraph = new HashMap<>();
        paragraph.put("type", "paragraph");

        if (text != null && !text.isEmpty()) {
            Map<String, Object> textContent = new HashMap<>();
            textContent.put("type", "text");
            textContent.put("text", text);
            paragraph.put("content", List.of(textContent));
        } else {
            paragraph.put("content", new ArrayList<>());
        }

        content.put("content", List.of(paragraph));
        return content;
    }


    /**
     * Create a new Jira project
     * @param projectData The project data to create
     * @return JsonNode containing the response
     * @throws Exception if the API call fails
     */
    public JsonNode createProject(Map<String, Object> projectData) throws Exception {
        try {
            logger.info("Creating new Jira project");
            
            // Build the API URL for creating a project
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/project";
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.POST, projectData);
            logger.info("Project created successfully");
            
            return response;
        } catch (Exception e) {
            logger.error("Error creating Jira project", e);
            throw e;
        }
    }

    /**
     * Make a Jira API call with proper authentication and timeout configuration
     * @param url The API endpoint URL
     * @param method The HTTP method to use
     * @param body The request body (for POST/PUT requests)
     * @return JsonNode containing the response
     * @throws Exception if the API call fails
     */
    private JsonNode makeJiraApiCall(String url, HttpMethod method, Object body) throws Exception {
        // Create authorization header using email and API token
        String credentials = jiraConfig.getEmail() + ":" + jiraConfig.getApiToken();
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
        
        logger.info("Making {} request to Jira API: {}", method, url);
        logger.info("Using credentials email: {}, token length: {}", jiraConfig.getEmail(), jiraConfig.getApiToken().length());
        if (body != null) {
            logger.info("Request body: {}", body);
        }
        
        // Build the URI
        URI uri = UriComponentsBuilder.fromUriString(url).build().toUri();
        
        // Create headers for the request
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Basic " + encodedCredentials);
        headers.set("Accept", "application/json");
        
        // For multipart requests (attachments), don't set Content-Type
        // For regular JSON requests, set Content-Type to application/json
        if (!url.contains("/attachments")) {
            headers.set("Content-Type", "application/json");
        } else {
            // For attachments, we need the X-Atlassian-Token header
            headers.set("X-Atlassian-Token", "no-check");
        }
        
        // Log headers for debugging
        logger.info("Request headers: Authorization={}, Accept={}, Content-Type={}", 
                   headers.getFirst("Authorization") != null ? "Basic ***" : "null",
                   headers.getFirst("Accept"),
                   headers.getFirst("Content-Type"));
        
        // Create request entity
        RequestEntity<?> requestEntity;
        if (body != null) {
            // For multipart requests (attachments)
            if (body instanceof org.springframework.util.MultiValueMap) {
                requestEntity = new RequestEntity<>(
                    (org.springframework.util.MultiValueMap<String, Object>) body,
                    headers,
                    method,
                    uri
                );
            } else {
                // 👉 Send body as JSON object (NOT stringified)
                requestEntity = new RequestEntity<>(body, headers, method, uri);
            }
        } else {
            requestEntity = new RequestEntity<>(headers, method, uri);
        }
        
        try {
            // Make the API call with timeout
            logger.info("Executing request to Jira API...");
            ResponseEntity<String> response = restTemplate.exchange(requestEntity, String.class);
            logger.info("Received response from Jira API: {} {}", response.getStatusCode(), response.getStatusCodeValue());
            
            // Handle empty responses (204 No Content, etc.)
            String responseBody = response.getBody();
            logger.info("Response body length: {}", responseBody != null ? responseBody.length() : 0);
            if (responseBody == null || responseBody.isEmpty()) {
                logger.info("Response body is empty");
                // Return an empty JSON object for empty responses
                return objectMapper.readTree("{}");
            }
            
            logger.info("Response body: {}", responseBody);
            
            // Parse and return the response
            return objectMapper.readTree(responseBody);
        } catch (Exception e) {
            logger.error("Error executing request to Jira API: {}", e.getMessage(), e);
            // Provide more specific error information
            if (e.getMessage() != null && e.getMessage().contains("504")) {
                throw new Exception("Gateway Timeout: Unable to connect to Jira API. This may be due to network issues or Jira server being temporarily unavailable. Please try again later.", e);
            } else if (e.getMessage() != null && e.getMessage().contains("401")) {
                throw new Exception("Authentication failed: Please check your Jira email and API token in the configuration.", e);
            } else if (e.getMessage() != null && e.getMessage().contains("403")) {
                throw new Exception("Access forbidden: Please check your Jira permissions and API token.", e);
            } else {
                throw new Exception("Failed to connect to Jira API: " + e.getMessage(), e);
            }
        }
    }
    
    /**
     * Helper method to safely extract text values from JsonNode
     * @param node The JsonNode to extract from
     * @param fieldName The field name to extract
     * @return The text value or null if not found
     */
    private String getTextValue(JsonNode node, String fieldName) {
        JsonNode fieldNode = node.get(fieldName);
        return fieldNode != null ? fieldNode.asText() : null;
    }

    /**
     * Delete a Jira project
     * @param projectKey The project key to delete
     * @return JsonNode containing the response
     * @throws Exception if the API call fails
     */
    public JsonNode deleteProject(String projectKey) throws Exception {
        try {
            logger.info("Deleting Jira project with key: {}", projectKey);
            
            // Build the API URL for deleting a project
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/project/" + projectKey;
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.DELETE, null);
            logger.info("Project deleted successfully: {}", projectKey);
            
            return response;
        } catch (Exception e) {
            logger.error("Error deleting Jira project with key: {}", projectKey, e);
            throw e;
        }
    }

    /**
     * Delete a Jira issue
     * @param issueIdOrKey The issue ID or key to delete
     * @return JsonNode containing the response
     * @throws Exception if the API call fails
     */
    public JsonNode deleteIssue(String issueIdOrKey) throws Exception {
        try {
            logger.info("Deleting Jira issue with ID/Key: {}", issueIdOrKey);
            
            // Build the API URL for deleting an issue
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/issue/" + issueIdOrKey;
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.DELETE, null);
            logger.info("Issue deleted successfully: {}", issueIdOrKey);
            
            return response;
        } catch (Exception e) {
            logger.error("Error deleting Jira issue with ID/Key: {}", issueIdOrKey, e);
            throw e;
        }
    }
    
    /**
     * Get a specific Jira issue by ID or key with all details
     * @param issueIdOrKey The issue ID or key
     * @return JsonNode containing the issue details
     * @throws Exception if the API call fails
     */
    public JsonNode getIssueByIdOrKey(String issueIdOrKey) throws Exception {
        try {
            logger.info("Fetching Jira issue with ID/Key: {}", issueIdOrKey);
            
            // Build the API URL for getting a specific issue with all expandable fields and explicitly request all fields including attachment
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/issue/" + issueIdOrKey + "?expand=renderedFields,names,schema,transitions,operations,editmeta,changelog&fields=*all";
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            logger.info("Issue fetched successfully: {}", issueIdOrKey);
            
            return response;
        } catch (Exception e) {
            logger.error("Error fetching Jira issue with ID/Key: {}", issueIdOrKey, e);
            throw e;
        }
    }
    
    /**
     * Get a specific field value from a Jira issue
     * @param issueIdOrKey The issue ID or key
     * @param fieldId The field ID (e.g., customfield_10405)
     * @return The field value as a string, or null if not found
     * @throws Exception if the API call fails
     */
    public String getIssueFieldValue(String issueIdOrKey, String fieldId) throws Exception {
        try {
            logger.info("Fetching field value {} for issue: {}", fieldId, issueIdOrKey);
            
            // Get the full issue details
            JsonNode issue = getIssueByIdOrKey(issueIdOrKey);
            
            logger.info("Successfully fetched issue details for: {}", issueIdOrKey);
            
            // Extract the field value from the fields
            JsonNode fields = issue.path("fields");
            JsonNode fieldValue = fields.path(fieldId);
            
            logger.info("Checking field value for fieldId: {} in issue: {}", fieldId, issueIdOrKey);
            
            if (fieldValue.isMissingNode() || fieldValue.isNull()) {
                logger.info("Field {} not found or is null for issue: {}", fieldId, issueIdOrKey);
                return null;
            }
            
            String value = fieldValue.asText();
            logger.info("Found field value for {} in issue {}: {}", fieldId, issueIdOrKey, value);
            
            return value;
        } catch (Exception e) {
            logger.error("Error fetching field value {} for issue: {}", fieldId, issueIdOrKey, e);
            logger.error("Exception details: {}", e.getMessage(), e);
            throw new Exception("Failed to fetch field value " + fieldId + " for issue " + issueIdOrKey + ": " + e.getMessage(), e);
        }
    }
    
    /**
     * Get comments for a specific Jira issue
     * @param issueIdOrKey The issue ID or key
     * @return JsonNode containing the comments
     * @throws Exception if the API call fails
     */
    public JsonNode getIssueComments(String issueIdOrKey) throws Exception {
        try {
            logger.info("Fetching comments for Jira issue: {}", issueIdOrKey);
            
            // Build the API URL for getting comments
            String url = jiraConfig.getBaseUrl() + "/rest/api/2/issue/" + issueIdOrKey + "/comment";
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            logger.info("Comments fetched successfully for issue: {}", issueIdOrKey);
            
            return response;
        } catch (Exception e) {
            logger.error("Error fetching comments for issue: {}", issueIdOrKey, e);
            throw e;
        }
    }
    
    /**
     * Get worklogs for a specific Jira issue
     * @param issueIdOrKey The issue ID or key
     * @return JsonNode containing the worklogs
     * @throws Exception if the API call fails
     */
    public JsonNode getIssueWorklogs(String issueIdOrKey) throws Exception {
        try {
            logger.info("Fetching worklogs for Jira issue: {}", issueIdOrKey);
            
            // Build the API URL for getting worklogs
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/issue/" + issueIdOrKey + "/worklog";
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            logger.info("Worklogs fetched successfully for issue: {}", issueIdOrKey);
            
            return response;
        } catch (Exception e) {
            logger.error("Error fetching worklogs for issue: {}", issueIdOrKey, e);
            throw e;
        }
    }

    /**
 * Add an attachment to a Jira issue
 * @param issueIdOrKey The issue ID or key
 * @param fileContent The file content as bytes
 * @param fileName The name of the file
 * @return JsonNode containing the response
 * @throws Exception if the API call fails
 */
public JsonNode addAttachmentToIssue(String issueIdOrKey, byte[] fileContent, String fileName) throws Exception {
    try {
        logger.info("Adding attachment to Jira issue: {}", issueIdOrKey);

        // Build the API URL for adding an attachment
        String url = jiraConfig.getBaseUrl() + "/rest/api/3/issue/" + issueIdOrKey + "/attachments";

        // Authorization header
        String credentials = jiraConfig.getEmail() + ":" + jiraConfig.getApiToken();
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

        // Build URI
        URI uri = UriComponentsBuilder.fromUriString(url).build().toUri();

        // Headers
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Basic " + encodedCredentials);
        headers.set("X-Atlassian-Token", "no-check");
        headers.setContentType(org.springframework.http.MediaType.MULTIPART_FORM_DATA);

        // File body
        org.springframework.util.LinkedMultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
        org.springframework.core.io.ByteArrayResource fileResource = new org.springframework.core.io.ByteArrayResource(fileContent) {
            @Override
            public String getFilename() {
                return fileName;
            }
        };
        body.add("file", fileResource);

        // Request
        RequestEntity<org.springframework.util.MultiValueMap<String, Object>> requestEntity =
                RequestEntity.post(uri).headers(headers).body(body);

        // Execute
        ResponseEntity<String> response = restTemplate.exchange(requestEntity, String.class);
        logger.info("Response from Jira: {}", response.getBody());

        // Parse JSON
        String responseBody = response.getBody();
        return responseBody != null && !responseBody.isEmpty()
                ? objectMapper.readTree(responseBody)
                : objectMapper.readTree("[]");

    } catch (Exception e) {
        logger.error("Error adding attachment to Jira issue: {}", issueIdOrKey, e);
        throw new Exception("Failed to add attachment to issue " + issueIdOrKey + ": " + e.getMessage(), e);
    }
}

    
    /**
     * Get attachments for a Jira issue
     * @param issueIdOrKey The issue ID or key
     * @return JsonNode containing the attachments
     * @throws Exception if the API call fails
     */
    public JsonNode getIssueAttachments(String issueIdOrKey) throws Exception {
        try {
            logger.info("Fetching attachments for Jira issue: {}", issueIdOrKey);
            
            // Build the API URL for getting attachments - explicitly request only the attachment field
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/issue/" + issueIdOrKey + "?fields=attachment";
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            logger.info("Full response from Jira for attachments: {}", response);
            
            // Extract attachments from the response
            JsonNode fieldsNode = response.get("fields");
            if (fieldsNode != null) {
                JsonNode attachmentsNode = fieldsNode.get("attachment");
                if (attachmentsNode != null) {
                    logger.info("Attachments found: {}", attachmentsNode);
                    return attachmentsNode;
                } else {
                    logger.info("No attachment field found in response");
                }
            } else {
                logger.info("No fields found in response");
            }
            
            // Return empty array if no attachments found
            return objectMapper.readTree("[]");
        } catch (Exception e) {
            logger.error("Error fetching attachments for Jira issue: {}", issueIdOrKey, e);
            throw new Exception("Failed to fetch attachments for issue " + issueIdOrKey + ": " + e.getMessage(), e);
        }
    }
    
    /**
     * Get attachment content by ID
     * @param attachmentId The attachment ID
     * @return byte array containing the attachment content
     * @throws Exception if the API call fails
     */
    public byte[] getAttachmentContent(String attachmentId) throws Exception {
        try {
            logger.info("Fetching attachment content for ID: {}", attachmentId);
            
            // Build the API URL for getting attachment content
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/attachment/content/" + attachmentId;
            
            // Create authorization header using email and API token
            String credentials = jiraConfig.getEmail() + ":" + jiraConfig.getApiToken();
            String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
            
            // Build the URI
            URI uri = UriComponentsBuilder.fromUriString(url).build().toUri();
            
            // Create headers for the request
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("Authorization", "Basic " + encodedCredentials);
            headers.set("Accept", "*/*"); // Accept any content type for binary data
            
            // Create request entity
            RequestEntity<?> requestEntity = new RequestEntity<>(headers, HttpMethod.GET, uri);
            
            // Make the API call
            ResponseEntity<byte[]> response = restTemplate.exchange(requestEntity, byte[].class);
            
            logger.info("Attachment content fetched successfully for ID: {}", attachmentId);
            
            return response.getBody();
        } catch (Exception e) {
            logger.error("Error fetching attachment content for ID: {}", attachmentId, e);
            throw new Exception("Failed to fetch attachment content for ID " + attachmentId + ": " + e.getMessage(), e);
        }
    }
    
    /**
     * Get transitions available for a specific Jira issue
     * @param issueIdOrKey The issue ID or key
     * @return JsonNode containing the available transitions for the issue
     * @throws Exception if the API call fails
     */
    
 // 🔥 UI → Jira Transition ID Mapping
    private static final Map<String, String> TRANSITION_MAP = Map.ofEntries(
        Map.entry("approve-request-created", "3"),
        Map.entry("decline-request-created", "6"),

        Map.entry("approve-pre-approval", "2"),
        Map.entry("decline-pre-approval", "6"),

        Map.entry("approve-request-review", "4"),
        Map.entry("decline-request-review", "6"),

        Map.entry("approve-negotiation-stage", "5"),
        Map.entry("decline-negotiation", "6"),

        Map.entry("approve-post-approval", "7"),
        Map.entry("decline-post-approval", "6")
    );

    
    public JsonNode getIssueTransitions(String issueIdOrKey) throws Exception {
        try {
            logger.info("Fetching transitions for Jira issue: {}", issueIdOrKey);
            
            // Build the API URL for getting transitions
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/issue/" + issueIdOrKey + "/transitions";
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            logger.info("Transitions fetched successfully for issue: {}", issueIdOrKey);
            logger.info("Raw transitions response type: {}", response.getClass().getName());
            logger.info("Raw transitions response: {}", response.toString());
            
            JsonNode transitionsNode = response.get("transitions");

         // Case 1: Normal Jira response: { transitions: [] }
         if (transitionsNode != null && transitionsNode.isArray()) {
             return transitionsNode;
         }

         // Case 2: If Jira directly returns an array
         if (response.isArray()) {
             return response;
         }

         // Case 3: No transitions
         return objectMapper.readTree("[]");

        } catch (Exception e) {
            logger.error("Error fetching transitions for issue: {}", issueIdOrKey, e);
            throw e;
        }
    }
    
    /**
     * Transition a Jira issue to a new status
     * @param issueIdOrKey The issue ID or key
     * @param transitionId The ID of the transition to execute
     * @return JsonNode containing the response
     * @throws Exception if the API call fails
     */
    private static String encodeCredentials(String username, String apiToken) {
        String credentials = username + ":" + apiToken;
        return Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }

    public boolean transitionIssue(String issueKey, String transitionId) {
        try {
            String user = jiraConfig.getEmail();
            String apiToken = jiraConfig.getApiToken();
            String url = jiraConfig.getBaseUrl() 
                    + "/rest/api/3/issue/" + issueKey + "/transitions";

            HttpClient httpClient = HttpClients.createDefault();
            HttpPost httpPost = new HttpPost(url);

            httpPost.setHeader("Authorization", "Basic " + encodeCredentials(user, apiToken));
            httpPost.setHeader("Accept", "application/json");
            httpPost.setHeader("Content-Type", "application/json");

            // 🔥 Using Jackson to build JSON
            ObjectMapper mapper = new ObjectMapper();
            ObjectNode root = mapper.createObjectNode();
            ObjectNode transitionObj = mapper.createObjectNode();
            transitionObj.put("id", transitionId);
            root.set("transition", transitionObj);

            httpPost.setEntity(new StringEntity(mapper.writeValueAsString(root)));

            HttpResponse response = httpClient.execute(httpPost);
            int status = response.getStatusLine().getStatusCode();
            String responseBody = EntityUtils.toString(response.getEntity());

            logger.info("➡️ TRANSITION CALL → {}", url);
            logger.info("➡️ PAYLOAD → {}", mapper.writeValueAsString(root));
            logger.info("⬅️ STATUS = {}", status);
            logger.info("⬅️ RESPONSE = {}", responseBody);

            if (status == 204 || status == 201) {
                logger.info("✅ Jira transition SUCCESS → {} -> {}", issueKey, transitionId);
                
                // Check if the issue status is now "Completed" and save contract details if so
                try {
                    String currentStatus = getIssueStatus(issueKey);
                    logger.info("Current status after transition: {}", currentStatus);
                    
                    if ("Completed".equals(currentStatus)) {
                        logger.info("Issue {} is now completed, checking for contract details to save", issueKey);
                        
                        // Get the issue details to extract vendor details
                        JsonNode issue = getIssueByIdOrKey(issueKey);
                        JsonNode fields = issue.path("fields");
                        
                        // Extract vendor details from custom fields
                        Map<String, Object> vendorDetails = new HashMap<>();
                        
                        // Extract basic information
                        vendorDetails.put("vendorName", getTextValue(fields, jiraFieldConfig.getVendorName()));
                        vendorDetails.put("productName", getTextValue(fields, jiraFieldConfig.getProductName()));
                        vendorDetails.put("vendorContractType", getTextValue(fields, jiraFieldConfig.getBillingType()));
                        vendorDetails.put("billingType", getTextValue(fields, jiraFieldConfig.getBillingType()));
                        vendorDetails.put("contractMode", getTextValue(fields, jiraFieldConfig.getContractType()));
                        vendorDetails.put("requesterName", getTextValue(fields, jiraFieldConfig.getRequesterName()));
                        vendorDetails.put("requesterMail", getTextValue(fields, jiraFieldConfig.getRequesterEmail()));
                        vendorDetails.put("department", getTextValue(fields, jiraFieldConfig.getDepartment()));
                        vendorDetails.put("organization", getTextValue(fields, jiraFieldConfig.getOrganization()));
                        vendorDetails.put("additionalComment", getTextValue(fields, jiraFieldConfig.getAdditionalComment()));
                        vendorDetails.put("dueDate", getTextValue(fields, jiraFieldConfig.getDueDate()));
                        vendorDetails.put("renewalDate", getTextValue(fields, jiraFieldConfig.getRenewalDate()));
                        vendorDetails.put("currentLicenseCount", getTextValue(fields, jiraFieldConfig.getCurrentLicenseCount()));
                        vendorDetails.put("currentUsageCount", getTextValue(fields, jiraFieldConfig.getCurrentUsageCount()));
                        vendorDetails.put("currentUnits", getTextValue(fields, jiraFieldConfig.getCurrentUnit()));
                        vendorDetails.put("newLicenseCount", getTextValue(fields, jiraFieldConfig.getNewLicenseCount()));
                        vendorDetails.put("newUsageCount", getTextValue(fields, jiraFieldConfig.getNewUsageCount()));
                        vendorDetails.put("newUnits", getTextValue(fields, jiraFieldConfig.getNewUnit()));
                        // Additional fields for RequestSplitView
                        vendorDetails.put("licenseUpdateType", getTextValue(fields, jiraFieldConfig.getLicenseUpdateType()));
                        vendorDetails.put("existingContractId", getTextValue(fields, jiraFieldConfig.getExistingContractId()));
                        vendorDetails.put("contractDuration", getTextValue(fields, jiraFieldConfig.getContractDuration()));
                        
                        // Extract issue updated date for completion date calculation
                        String updatedDate = issue.path("updated").asText();
                        vendorDetails.put("completionDate", updatedDate);

                        logger.info("Saving contract details for completed issue: {}", issueKey);
                        saveContractDetailsForCompletedIssue(vendorDetails);
                    }
                } catch (Exception e) {
                    logger.error("Error checking status or saving contract details for issue: {}", issueKey, e);
                }
                
                return true;
            } else {
                logger.error("❌ Jira transition FAILED → {} (id={}), status={}, body={}", 
                             issueKey, transitionId, status, responseBody);
                return false;
            }

        } catch (Exception e) {
            logger.error("❌ Jira transition FAILED with exception", e);
            return false;
        }
    }

    
    public boolean transitionIssueByKey(String issueKey, String transitionKey) throws Exception {
        logger.info("Received UI transition key: {}", transitionKey);

        String transitionId = TRANSITION_MAP.get(transitionKey);
        
        // If not found in map, check if it's a direct transition ID
        if (transitionId == null) {
            // Check if transitionKey is a numeric ID
            if (transitionKey != null && transitionKey.matches("\\d+")) {
                transitionId = transitionKey;
            } else {
                throw new Exception("Invalid transition key: " + transitionKey);
            }
        }

        return transitionIssue(issueKey, transitionId);
    }




    /**
     * Get current user information
     * @return JsonNode containing the current user information
     * @throws Exception if the API call fails
     */
    public JsonNode getCurrentUser() throws Exception {
        try {
            logger.info("Fetching current user information");
            
            // Build the API URL for getting current user info
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/myself";
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            logger.info("Current user information fetched successfully");
            
            return response;
        } catch (Exception e) {
            logger.error("Error fetching current user information", e);
            throw new Exception("Failed to fetch current user information: " + e.getMessage(), e);
        }
    }

    /**
     * Get metadata for creating issues in Jira
     * @param projectKey Optional project key to filter issue types
     * @return JsonNode containing the create metadata
     * @throws Exception if the API call fails
     */
    public JsonNode getCreateMeta(String projectKey) throws Exception {
        try {
            logger.info("Fetching create metadata for project: {}", projectKey);
            
            // Build the API URL for getting create metadata
            StringBuilder urlBuilder = new StringBuilder(jiraConfig.getBaseUrl() + "/rest/api/3/issue/createmeta");
            
            // Add query parameters
            List<String> queryParams = new ArrayList<>();
            if (projectKey != null && !projectKey.isEmpty()) {
                queryParams.add("projectKeys=" + projectKey);
            }
            queryParams.add("expand=projects.issuetypes.fields");
            
            if (!queryParams.isEmpty()) {
                urlBuilder.append("?").append(String.join("&", queryParams));
            }
            
            String url = urlBuilder.toString();
            logger.info("Making API call to Jira with URL: {}", url);
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            logger.info("Create metadata fetched successfully for project: {}", projectKey);
            logger.info("Raw response from Jira: {}", response != null ? response.toString() : "null");
            
            // Extract projects from response
            JsonNode projectsNode = response.get("projects");
            if (projectsNode != null) {
                logger.info("Found projects node with {} projects", projectsNode.isArray() ? projectsNode.size() : "not an array");
                return projectsNode;
            }
            
            // Return empty array if no projects found
            logger.warn("No projects node found in response, returning empty array");
            return objectMapper.readTree("[]");
        } catch (Exception e) {
            logger.error("Error fetching create metadata for project: {}", projectKey, e);
            throw new Exception("Failed to fetch create metadata: " + e.getMessage(), e);
        }
    }

    /**
     * Create a new Jira issue with the proper Jira API structure
     * @param issueData The issue data to create
     * @return JsonNode containing the response
     * @throws Exception if the API call fails
     */
    public JsonNode createIssueJira(Map<String, Object> issueData) throws Exception {

        logger.info("📥 Received payload: {}", issueData);
        
        // Log the vendorDetails specifically to see if organization is present
        Map<String, Object> vendorDetails = (Map<String, Object>) issueData.get("vendorDetails");
        if (vendorDetails != null) {
            logger.info("📥 Vendor Details: {}", vendorDetails);
            logger.info("📥 Department: {}", vendorDetails.get("department"));
            logger.info("📥 Organization: {}", vendorDetails.get("organization"));
        }

        if (vendorDetails == null) {
            throw new IllegalArgumentException("vendorDetails is required");
        }

        Map<String, Object> fields = new HashMap<>();

        // Required
        String vendorName = clean(vendorDetails.get("vendorName"));
        fields.put("summary", "Contract: " + (vendorName == null ? "Unknown" : vendorName));
        fields.put("issuetype", Map.of("id", "10232"));
        fields.put("project", Map.of("key", jiraConfig.getContractProjectKey()));

        // Custom fields – convert "" → null
        put(fields, jiraFieldConfig.getContractType(), vendorDetails.get("contractMode"));
        put(fields, jiraFieldConfig.getVendorName(), vendorDetails.get("vendorName"));
        put(fields, jiraFieldConfig.getProductName(), vendorDetails.get("productName"));
        put(fields, jiraFieldConfig.getBillingType(), vendorDetails.get("vendorContractType"));

        put(fields, jiraFieldConfig.getRequesterName(), vendorDetails.get("requesterName"));
        put(fields, jiraFieldConfig.getRequesterEmail(), vendorDetails.get("requesterMail"));
        put(fields, jiraFieldConfig.getDepartment(), vendorDetails.get("department"));
        put(fields, jiraFieldConfig.getOrganization(), vendorDetails.get("organization"));
        put(fields, jiraFieldConfig.getAdditionalComment(), vendorDetails.get("additionalComment"));

        // Log the fields that are being set
        logger.info("Fields being sent to Jira:");
        logger.info("  Department field ({}): {}", jiraFieldConfig.getDepartment(), fields.get(jiraFieldConfig.getDepartment()));
        logger.info("  Organization field ({}): {}", jiraFieldConfig.getOrganization(), fields.get(jiraFieldConfig.getOrganization()));

        put(fields, jiraFieldConfig.getDueDate(), vendorDetails.get("dueDate"));
        put(fields, jiraFieldConfig.getRenewalDate(), vendorDetails.get("renewalDate"));

        put(fields, jiraFieldConfig.getCurrentLicenseCount(), vendorDetails.get("currentLicenseCount"));
        put(fields, jiraFieldConfig.getCurrentUsageCount(), vendorDetails.get("currentUsageCount"));
        put(fields, jiraFieldConfig.getCurrentUnit(), vendorDetails.get("currentUnits"));

        put(fields, jiraFieldConfig.getNewLicenseCount(), vendorDetails.get("newLicenseCount"));
        put(fields, jiraFieldConfig.getNewUsageCount(), vendorDetails.get("newUsageCount"));
        put(fields, jiraFieldConfig.getNewUnit(), vendorDetails.get("newUnits"));

        put(fields, jiraFieldConfig.getLicenseUpdateType(), vendorDetails.get("licenseUpdateType"));
        put(fields, jiraFieldConfig.getExistingContractId(), vendorDetails.get("selectedExistingContractId"));
        put(fields, jiraFieldConfig.getContractDuration(), vendorDetails.get("contractDuration"));

        Map<String, Object> payload = Map.of("fields", fields);

        logger.info("🚀 JIRA PAYLOAD (cleaned) => {}", payload);

        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(jiraConfig.getEmail(), jiraConfig.getApiToken());
        headers.set("Content-Type", "application/json");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        String url = jiraConfig.getBaseUrl() + "/rest/api/3/issue";
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

        int status = response.getStatusCodeValue();
        String body = response.getBody();

        logger.info("Jira status: {} body={}", status, body);

        if (status < 200 || status >= 300) {
            logger.error("❌ JIRA ERROR BODY => {}", body);
            throw new Exception("Jira error " + status + ": " + body);
        }

        // ⭐ REMOVED: Do not save contract details immediately when creating an issue
        // Contract details will only be saved when status is transitioned to "Completed"
        // saveContractDetails(vendorDetails);

        ObjectMapper mapper = new ObjectMapper();
        return (body == null || body.isBlank()) ? mapper.readTree("{}") : mapper.readTree(body);
    }

    /**
     * Removes empty or blank values → returns null
     */
    private String clean(Object v) {
        if (v == null) return null;
        String s = v.toString().trim();
        return s.isEmpty() ? null : s;
    }

    /**
     * Only put field if value is not null or not empty
     */
    private void put(Map<String, Object> map, String key, Object value) {
        String cleaned = clean(value);
        if (cleaned != null) {
            map.put(key, cleaned);
        }
    }

    /**
     * Converts ANY value to text safely — including null, number, date, boolean.
     */
    private Object safeValue(Object value) {
        if (value == null) return null;
        String v = String.valueOf(value).trim();
        return v.isEmpty() ? null : v;
    }

    /**
     * Save contract details to the database
     * @param vendorDetails The vendor details map from the frontend
     */
    private void saveContractDetails(Map<String, Object> vendorDetails) {
        try {
            logger.info("Saving contract details to database: {}", vendorDetails);
            
            if (vendorDetails == null) {
                logger.warn("Vendor details is null, skipping contract save");
                return;
            }
            
            ContractDetails contract = new ContractDetails();
            
            // Set contract type
            String contractMode = clean(vendorDetails.get("contractMode"));
            contract.setContractType(contractMode);
            logger.info("Set contract type: {}", contractMode);
            
            // Set vendor and product details
            contract.setNameOfVendor(clean(vendorDetails.get("vendorName")));
            contract.setProductName(clean(vendorDetails.get("productName")));
            
            // Set billing details
            contract.setVendorContractType(clean(vendorDetails.get("vendorContractType")));
            
            // Set requester details
            contract.setRequesterName(clean(vendorDetails.get("requesterName")));
            contract.setRequesterMail(clean(vendorDetails.get("requesterMail")));
            
         // store text (good)
            contract.setRequesterDepartment(clean(vendorDetails.get("department")));
            contract.setRequesterOrganization(clean(vendorDetails.get("organization")));

            // 🔥 FIX: also store real IDs for filtering
            try {
                String email = clean(vendorDetails.get("requesterMail"));
                if (email != null) {
                    User requester = userRepository.findByEmail(email).orElse(null);
                    if (requester != null) {
                        contract.setRequester(requester);
                        if (requester.getDepartment() != null) {
                            contract.setRequesterDepartmentId(requester.getDepartment().getId());
                        }

                        if (requester.getOrganization() != null) {
                            contract.setRequesterOrganizationId(requester.getOrganization().getId());
                        }
                    }
                }
            } catch (Exception e) {
                logger.warn("Failed to resolve requester ID from email", e);
            }

            // Log the values being set
            logger.info("Saving contract details:");
            logger.info("  Requester Name: {}", contract.getRequesterName());
            logger.info("  Requester Mail: {}", contract.getRequesterMail());
            logger.info("  Requester Department: {}", contract.getRequesterDepartment());
            logger.info("  Requester Organization: {}", contract.getRequesterOrganization());

            // Set comments
            contract.setAdditionalComment(clean(vendorDetails.get("additionalComment")));
            
            // Set contract dates
            String dueDateStr = clean(vendorDetails.get("dueDate"));
            if (dueDateStr != null && !dueDateStr.isEmpty()) {
                try {
                    contract.setDueDate(java.time.LocalDate.parse(dueDateStr));
                } catch (Exception e) {
                    logger.warn("Failed to parse due date: {}", dueDateStr, e);
                }
            }
            
            // Calculate renewal date based on completion date + contract duration for completed requests
            String contractDurationStr = clean(vendorDetails.get("contractDuration"));
            if (contractDurationStr != null && !contractDurationStr.isEmpty()) {
                try {
                    // Parse contract duration
                    int contractDuration = Integer.parseInt(contractDurationStr);
                    
                    // Get completion date from Jira issue updated date
                    String completionDateStr = clean(vendorDetails.get("completionDate"));
                    java.time.LocalDate completionDate = null;
                    
                    if (completionDateStr != null && !completionDateStr.isEmpty()) {
                        // Parse the ISO date string (e.g., "2023-12-01T10:30:00.000+0530")
                        // Take only the date part before 'T'
                        int tIndex = completionDateStr.indexOf('T');
                        if (tIndex > 0) {
                            completionDateStr = completionDateStr.substring(0, tIndex);
                        }
                        completionDate = java.time.LocalDate.parse(completionDateStr);
                    } else {
                        // Fallback to current date if completion date is not available
                        completionDate = java.time.LocalDate.now();
                    }
                    
                    // Calculate renewal date = completion date + contract duration (in months)
                    java.time.LocalDate calculatedRenewalDate = completionDate.plusMonths(contractDuration);
                    contract.setRenewalDate(calculatedRenewalDate);
                    
                    logger.info("Calculated renewal date: {} based on completion date: {} and contract duration: {} months", 
                        calculatedRenewalDate, completionDate, contractDuration);
                } catch (Exception e) {
                    logger.warn("Failed to calculate renewal date based on contract duration: {}", contractDurationStr, e);
                    
                    // Fall back to the renewal date from Jira fields if calculation fails
                    String renewalDateStr = clean(vendorDetails.get("renewalDate"));
                    if (renewalDateStr != null && !renewalDateStr.isEmpty()) {
                        try {
                            contract.setRenewalDate(java.time.LocalDate.parse(renewalDateStr));
                        } catch (Exception parseException) {
                            logger.warn("Failed to parse renewal date: {}", renewalDateStr, parseException);
                        }
                    }
                }
            } else {
                // If no contract duration, fall back to the renewal date from Jira fields
                String renewalDateStr = clean(vendorDetails.get("renewalDate"));
                if (renewalDateStr != null && !renewalDateStr.isEmpty()) {
                    try {
                        contract.setRenewalDate(java.time.LocalDate.parse(renewalDateStr));
                    } catch (Exception e) {
                        logger.warn("Failed to parse renewal date: {}", renewalDateStr, e);
                    }
                }
            }
            
            // Set current values
            try {
                String currentLicenseCountStr = clean(vendorDetails.get("currentLicenseCount"));
                if (currentLicenseCountStr != null && !currentLicenseCountStr.isEmpty()) {
                    contract.setCurrentLicenseCount(Integer.parseInt(currentLicenseCountStr));
                }
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse current license count", e);
            }
            
            try {
                String currentUsageCountStr = clean(vendorDetails.get("currentUsageCount"));
                if (currentUsageCountStr != null && !currentUsageCountStr.isEmpty()) {
                    contract.setCurrentUsageCount(Integer.parseInt(currentUsageCountStr));
                }
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse current usage count", e);
            }
            
            contract.setCurrentUnits(clean(vendorDetails.get("currentUnits")));
            
            // Set new values
            try {
                String newLicenseCountStr = clean(vendorDetails.get("newLicenseCount"));
                if (newLicenseCountStr != null && !newLicenseCountStr.isEmpty()) {
                    contract.setNewLicenseCount(Integer.parseInt(newLicenseCountStr));
                }
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse new license count", e);
            }
            
            try {
                String newUsageCountStr = clean(vendorDetails.get("newUsageCount"));
                if (newUsageCountStr != null && !newUsageCountStr.isEmpty()) {
                    contract.setNewUsageCount(Integer.parseInt(newUsageCountStr));
                }
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse new usage count", e);
            }
            
            contract.setNewUnits(clean(vendorDetails.get("newUnits")));
            
            // Set attachments
            contract.setAttachments(clean(vendorDetails.get("attachments")));
            
            // Save to database
            logger.info("Attempting to save contract to database: {}", contract);
            ContractDetails savedContract = contractDetailsService.saveContract(contract);
            logger.info("Contract saved successfully with ID: {}", savedContract.getId());
        } catch (Exception e) {
            logger.error("Error saving contract details to database", e);
            // Don't throw exception as we don't want to break the Jira issue creation if DB save fails
        }
    }
    
    /**
     * Save contract details to the database
     * @param vendorDetails The vendor details map from the frontend
     */
//    private void saveContractDetails(Map<String, Object> vendorDetails) {
//        // ⭐ MODIFIED: Do not save contract details immediately when creating an issue
//        // Contract details will only be saved when status is transitioned to "Completed"
//        logger.info("Skipping immediate contract details save. Contract details will be saved on status completion.");
//        return;
//    }
//    
    /**
     * Save contract details for a completed issue to the database
     * @param vendorDetails The vendor details map from the frontend
     */
    private void saveContractDetailsForCompletedIssue(Map<String, Object> vendorDetails) {
        try {
            logger.info("Saving contract details for completed issue to database: {}", vendorDetails);
            
            if (vendorDetails == null) {
                logger.warn("Vendor details is null, skipping contract save");
                return;
            }
            
            ContractDetails contract = new ContractDetails();
            
            // Set contract type to "completed" for completed issues
            contract.setContractType("completed");
            logger.info("Set contract type to completed");
            
            // Set vendor and product details
            contract.setNameOfVendor(clean(vendorDetails.get("vendorName")));
            contract.setProductName(clean(vendorDetails.get("productName")));
            
            // Set billing details
            contract.setVendorContractType(clean(vendorDetails.get("vendorContractType")));
            contract.setBillingType(clean(vendorDetails.get("billingType")));
            
            // Set requester details
            contract.setRequesterName(clean(vendorDetails.get("requesterName")));
            contract.setRequesterMail(clean(vendorDetails.get("requesterMail")));
            
            // store text (good)
            contract.setRequesterDepartment(clean(vendorDetails.get("department")));
            contract.setRequesterOrganization(clean(vendorDetails.get("organization")));

            // 🔥 FIX: also store real IDs for filtering
            try {
                String email = clean(vendorDetails.get("requesterMail"));
                if (email != null) {
                    User requester = userRepository.findByEmail(email).orElse(null);
                    if (requester != null) {
                        contract.setRequester(requester);
                        if (requester.getDepartment() != null) {
                            contract.setRequesterDepartmentId(requester.getDepartment().getId());
                        }
                        
                        if (requester.getOrganization() != null) {
                            contract.setRequesterOrganizationId(requester.getOrganization().getId());
                        }
                    }
                }
            } catch (Exception e) {
                logger.warn("Failed to resolve requester ID from email", e);
            }

            // Log the values being set
            logger.info("Saving contract details for completed issue:");
            logger.info("  Requester Name: {}", contract.getRequesterName());
            logger.info("  Requester Mail: {}", contract.getRequesterMail());
            logger.info("  Requester Department: {}", contract.getRequesterDepartment());
            logger.info("  Requester Organization: {}", contract.getRequesterOrganization());

            // Set comments
            contract.setAdditionalComment(clean(vendorDetails.get("additionalComment")));
            
            // Set contract dates
            String dueDateStr = clean(vendorDetails.get("dueDate"));
            if (dueDateStr != null && !dueDateStr.isEmpty()) {
                try {
                    contract.setDueDate(java.time.LocalDate.parse(dueDateStr));
                } catch (Exception e) {
                    logger.warn("Failed to parse due date: {}", dueDateStr, e);
                }
            }
            
            // Calculate renewal date based on completion date + contract duration for completed requests
            String contractDurationStr = clean(vendorDetails.get("contractDuration"));
            if (contractDurationStr != null && !contractDurationStr.isEmpty()) {
                try {
                    // Parse contract duration
                    int contractDuration = Integer.parseInt(contractDurationStr);
                    
                    // Get completion date from Jira issue updated date
                    String completionDateStr = clean(vendorDetails.get("completionDate"));
                    java.time.LocalDate completionDate = null;
                    
                    if (completionDateStr != null && !completionDateStr.isEmpty()) {
                        // Parse the ISO date string (e.g., "2023-12-01T10:30:00.000+0530")
                        // Take only the date part before 'T'
                        int tIndex = completionDateStr.indexOf('T');
                        if (tIndex > 0) {
                            completionDateStr = completionDateStr.substring(0, tIndex);
                        }
                        completionDate = java.time.LocalDate.parse(completionDateStr);
                    } else {
                        // Fallback to current date if completion date is not available
                        completionDate = java.time.LocalDate.now();
                    }
                    
                    // Calculate renewal date = completion date + contract duration (in months)
                    java.time.LocalDate calculatedRenewalDate = completionDate.plusMonths(contractDuration);
                    contract.setRenewalDate(calculatedRenewalDate);
                    
                    logger.info("Calculated renewal date: {} based on completion date: {} and contract duration: {} months", 
                        calculatedRenewalDate, completionDate, contractDuration);
                } catch (Exception e) {
                    logger.warn("Failed to calculate renewal date based on contract duration: {}", contractDurationStr, e);
                    
                    // Fall back to the renewal date from Jira fields if calculation fails
                    String renewalDateStr = clean(vendorDetails.get("renewalDate"));
                    if (renewalDateStr != null && !renewalDateStr.isEmpty()) {
                        try {
                            contract.setRenewalDate(java.time.LocalDate.parse(renewalDateStr));
                        } catch (Exception parseException) {
                            logger.warn("Failed to parse renewal date: {}", renewalDateStr, parseException);
                        }
                    }
                }
            } else {
                // If no contract duration, fall back to the renewal date from Jira fields
                String renewalDateStr = clean(vendorDetails.get("renewalDate"));
                if (renewalDateStr != null && !renewalDateStr.isEmpty()) {
                    try {
                        contract.setRenewalDate(java.time.LocalDate.parse(renewalDateStr));
                    } catch (Exception e) {
                        logger.warn("Failed to parse renewal date: {}", renewalDateStr, e);
                    }
                }
            }
            
            // Set current values
            try {
                String currentLicenseCountStr = clean(vendorDetails.get("currentLicenseCount"));
                if (currentLicenseCountStr != null && !currentLicenseCountStr.isEmpty()) {
                    contract.setCurrentLicenseCount(Integer.parseInt(currentLicenseCountStr));
                }
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse current license count", e);
            }
            
            try {
                String currentUsageCountStr = clean(vendorDetails.get("currentUsageCount"));
                if (currentUsageCountStr != null && !currentUsageCountStr.isEmpty()) {
                    contract.setCurrentUsageCount(Integer.parseInt(currentUsageCountStr));
                }
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse current usage count", e);
            }
            
            contract.setCurrentUnits(clean(vendorDetails.get("currentUnits")));
            
            // Set new values
            try {
                String newLicenseCountStr = clean(vendorDetails.get("newLicenseCount"));
                if (newLicenseCountStr != null && !newLicenseCountStr.isEmpty()) {
                    contract.setNewLicenseCount(Integer.parseInt(newLicenseCountStr));
                }
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse new license count", e);
            }
            
            try {
                String newUsageCountStr = clean(vendorDetails.get("newUsageCount"));
                if (newUsageCountStr != null && !newUsageCountStr.isEmpty()) {
                    contract.setNewUsageCount(Integer.parseInt(newUsageCountStr));
                }
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse new usage count", e);
            }
            
            contract.setNewUnits(clean(vendorDetails.get("newUnits")));
            
            // Set additional fields for RequestSplitView
            contract.setLicenseUpdateType(clean(vendorDetails.get("licenseUpdateType")));
            contract.setExistingContractId(clean(vendorDetails.get("existingContractId")));
            
            // Set attachments
            contract.setAttachments(clean(vendorDetails.get("attachments")));
            
            // Log the contract before saving
            logger.info("Contract details before saving: {}", contract);

            // Save to database
            logger.info("Attempting to save contract for completed issue to database: {}", contract);
            ContractDetails savedContract = contractDetailsService.saveContract(contract);
            logger.info("Contract for completed issue saved successfully with ID: {}", savedContract.getId());
        } catch (Exception e) {
            logger.error("Error saving contract details for completed issue to database", e);
            // Don't throw exception as we don't want to break the Jira issue creation if DB save fails
        }
    }
    
    /**
     * Add an attachment to a Jira issue with the required X-Atlassian-Token header
     * @param issueKey The issue key
     * @param fileContent The file content as bytes
     * @param fileName The name of the file
     * @return JsonNode containing the response
     * @throws Exception if the API call fails
     */
    public JsonNode addAttachmentToIssueJira(String issueKey, byte[] fileContent, String fileName) throws Exception {
        try {
            logger.info("Adding attachment to Jira issue with X-Atlassian-Token header: {}", issueKey);
            
            // Build the API URL for adding an attachment
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/issue/" + issueKey + "/attachments";
            
            // Create authorization header using email and API token
            String credentials = jiraConfig.getEmail() + ":" + jiraConfig.getApiToken();
            String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
            
            // Build the URI
            URI uri = UriComponentsBuilder.fromUriString(url).build().toUri();
            
            // Create headers for the request (different from regular API calls)
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("Authorization", "Basic " + encodedCredentials);
            headers.set("X-Atlassian-Token", "no-check"); // Required for Jira Cloud
            // Do not set Content-Type manually for multipart requests - let Spring handle it
            
            // Create multipart request
            org.springframework.util.LinkedMultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
            
            // Create a ByteArrayResource for the file content
            org.springframework.core.io.ByteArrayResource fileResource = new org.springframework.core.io.ByteArrayResource(fileContent) {
                @Override
                public String getFilename() {
                    return fileName;
                }
            };
            
            body.add("file", fileResource);
            
            // Create request entity
            RequestEntity<org.springframework.util.MultiValueMap<String, Object>> requestEntity = 
                RequestEntity.post(uri).headers(headers).body(body);
            
            // Make the API call
            ResponseEntity<String> response = restTemplate.exchange(requestEntity, String.class);
            
            // Handle empty responses
            String responseBody = response.getBody();
            if (responseBody == null || responseBody.isEmpty()) {
                // Return an empty JSON array for empty responses (Jira returns an array of attachment objects)
                return objectMapper.readTree("[]");
            }
            
            // Parse and return the response
            return objectMapper.readTree(responseBody);
        } catch (Exception e) {
            logger.error("Error adding attachment to Jira issue: {}", issueKey, e);
            throw new Exception("Failed to add attachment to issue " + issueKey + ": " + e.getMessage(), e);
        }
    }
    
    /**
     * Add a comment to a Jira issue
     * @param issueIdOrKey The issue ID or key
     * @param commentBody The comment body text
     * @return JsonNode containing the created comment
     * @throws Exception if the API call fails
     */
    public JsonNode addComment(String issueIdOrKey, String commentBody) throws Exception {
        try {
            logger.info("Adding comment to Jira issue: {}", issueIdOrKey);

            // Use Jira Cloud ADF (Atlassian Document Format)
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/issue/" + issueIdOrKey + "/comment";

            // Construct Atlassian Document Format (ADF) payload
            Map<String, Object> textContent = Map.of(
                "type", "text",
                "text", commentBody
            );

            Map<String, Object> paragraph = Map.of(
                "type", "paragraph",
                "content", List.of(textContent)
            );

            Map<String, Object> body = Map.of(
                "type", "doc",
                "version", 1,
                "content", List.of(paragraph)
            );

            Map<String, Object> requestBody = Map.of("body", body);

            logger.info("Comment request payload: {}", requestBody);

            JsonNode response = makeJiraApiCall(url, HttpMethod.POST, requestBody);
            logger.info("Comment added successfully to issue: {}", issueIdOrKey);

            return response;
        } catch (Exception e) {
            logger.error("Error adding comment to issue: {}", issueIdOrKey, e);
            throw new Exception("Failed to add comment: " + e.getMessage(), e);
        }
    }
    
    public JsonNode getIssueStatuses(String issueIdOrKey) throws Exception {
        try {
            logger.info("Fetching statuses for issue: {}", issueIdOrKey);

            String url = jiraConfig.getBaseUrl()
                    + "/rest/api/3/issue/" + issueIdOrKey + "?expand=editmeta";

            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);

            JsonNode editMeta = response.path("editmeta");
            JsonNode fields = editMeta.path("fields");
            JsonNode statusField = fields.path("status");
            JsonNode allowedValues = statusField.path("allowedValues");

            if (allowedValues.isArray()) {
                logger.info("Found {} statuses", allowedValues.size());
                return allowedValues;
            }

            logger.warn("No allowedValues found for status field, returning empty array");
            return objectMapper.readTree("[]");

        } catch (Exception e) {
            logger.error("Error fetching statuses", e);
            throw new Exception("Failed to fetch statuses: " + e.getMessage(), e);
        }
    }
    
    /**
     * Get the current status of a Jira issue
     * @param issueIdOrKey The issue ID or key
     * @return The current status name
     * @throws Exception if the API call fails
     */
    public String getIssueStatus(String issueIdOrKey) throws Exception {
        try {
            logger.info("Fetching current status for issue: {}", issueIdOrKey);
            
            // Get the full issue details
            JsonNode issue = getIssueByIdOrKey(issueIdOrKey);
            
            // Extract the status from the fields
            JsonNode fields = issue.path("fields");
            JsonNode status = fields.path("status");
            JsonNode statusName = status.path("name");
            
            String statusValue = statusName.asText();
            logger.info("Current status for issue {}: {}", issueIdOrKey, statusValue);
            
            return statusValue;
        } catch (Exception e) {
            logger.error("Error fetching status for issue: {}", issueIdOrKey, e);
            throw new Exception("Failed to fetch status for issue " + issueIdOrKey + ": " + e.getMessage(), e);
        }
    }
    
    /**
     * Helper method to extract text value from a JSON field
     * @param fields The fields JSON node
     * @param fieldId The field ID to extract
     * @return The field value as a string, or null if not found
     */
    private String getTextValue(JsonNode fields, String fieldId) {
        if (fields == null || fieldId == null) {
            return null;
        }
        
        JsonNode field = fields.path(fieldId);
        if (field.isNull() || field.isMissingNode()) {
            return null;
        }
        
        // If it's a text field, return as string
        if (field.isTextual()) {
            return field.asText();
        }
        
        // If it's a number, convert to string
        if (field.isNumber()) {
            return field.asText();
        }
        
        // If it's an object with a value property (select lists, etc.)
        if (field.has("value")) {
            return field.get("value").asText();
        }
        
        // If it's an object with a displayName property (users, etc.)
        if (field.has("displayName")) {
            return field.get("displayName").asText();
        }
        
        // For all other cases, convert to string
        return field.toString();

    
    public List<ContractDTO> getAllContractsDTO() {
        return contractDetailsRepository.findAll().stream().map(c -> {
            ContractDTO dto = new ContractDTO();

            dto.setId(c.getId());
            dto.setNameOfVendor(c.getNameOfVendor());
            dto.setProductName(c.getProductName());
            dto.setRequesterName(c.getRequesterName());
            dto.setRequesterEmail(c.getRequesterMail());
            dto.setRequesterDepartment(c.getRequesterDepartment());
            dto.setVendorContractType(c.getVendorContractType());
            dto.setAdditionalComment(c.getAdditionalComment());
            
            dto.setCurrentLicenseCount(c.getCurrentLicenseCount());
            dto.setCurrentUsageCount(c.getCurrentUsageCount());
            dto.setCurrentUnits(c.getCurrentUnits());

            dto.setNewLicenseCount(c.getNewLicenseCount());
            dto.setNewUsageCount(c.getNewUsageCount());
            dto.setNewUnits(c.getNewUnits());

            dto.setDueDate(c.getDueDate() != null ? c.getDueDate().toString() : null);
            dto.setRenewalDate(c.getRenewalDate() != null ? c.getRenewalDate().toString() : null);


            return dto;
        }).collect(java.util.stream.Collectors.toList());
    }


}
}
