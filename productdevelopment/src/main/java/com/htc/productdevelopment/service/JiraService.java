package com.htc.productdevelopment.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.htc.productdevelopment.config.JiraConfig;
import com.htc.productdevelopment.model.JiraProject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpMethod;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
    
    // JSON parser for handling API responses
    private final ObjectMapper objectMapper;

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
            throw e;
        }
    }

    /**
     * Get issues for a specific Jira project
     * @param projectKey The project key
     * @return List of issues for the project
     * @throws Exception if the API call fails
     */
    public JsonNode getIssuesForProject(String projectKey) throws Exception {
        try {
            logger.info("Fetching issues for project key: {}", projectKey);
            
            // Build the API URL for searching issues using the new JQL endpoint
            String url = UriComponentsBuilder.fromHttpUrl(jiraConfig.getBaseUrl())
                .path("/rest/api/3/search/jql")
                .toUriString();
            
            // Create the request body with JQL query to filter issues by project
            Map<String, Object> requestBody = Map.of(
                "jql", "project = " + projectKey,
                "maxResults", 50, // Limit results for better performance
                "fields", List.of(
                    "summary",
                    "issuetype",
                    "status",
                    "priority",
                    "assignee",
                    "reporter",
                    "customfield_10200",
                    "customfield_10201"
                )
            );
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.POST, requestBody);
            logger.info("Issues fetched successfully for project: {}", projectKey);
            
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
            throw e;
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
            logger.info("Creating new Jira issue");
            
            // Build the API URL for creating an issue
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/issue";
            
            // Prepare the request body for Jira API
            Map<String, Object> fields = new HashMap<>();
            
            // Add project
            fields.put("project", Map.of("key", issueData.get("project")));
            
            // Add issue type
            fields.put("issuetype", Map.of("name", issueData.get("issueType")));
            
            // Add summary
            fields.put("summary", issueData.get("summary"));
            
            // Add description if provided in Atlassian Document Format
            if (issueData.get("description") != null && !((String) issueData.get("description")).isEmpty()) {
                fields.put("description", createAtlassianDocumentFormat((String) issueData.get("description")));
            }
            
            // Add due date if provided
            if (issueData.get("dueDate") != null && !((String) issueData.get("dueDate")).isEmpty()) {
                fields.put("duedate", issueData.get("dueDate"));
            }
            
            // Add assignee using hardcoded custom field (customfield_10200)
            if (issueData.get("assigneeCustom") != null && !((String) issueData.get("assigneeCustom")).isEmpty()) {
                fields.put("customfield_10200", issueData.get("assigneeCustom"));
            }
            
            // Add reporter using hardcoded custom field (customfield_10201)
            if (issueData.get("reporterCustom") != null && !((String) issueData.get("reporterCustom")).isEmpty()) {
                fields.put("customfield_10201", issueData.get("reporterCustom"));
            }
            
            Map<String, Object> requestBody = Map.of("fields", fields);
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.POST, requestBody);
            logger.info("Issue created successfully");
            
            return response;
        } catch (Exception e) {
            logger.error("Error creating Jira issue", e);
            throw e;
        }
    }

    /**
     * Create Atlassian Document Format structure for description
     * @param text The plain text description
     * @return Map representing the ADF structure
     */
    private Map<String, Object> createAtlassianDocumentFormat(String text) {
        Map<String, Object> content = new HashMap<>();
        content.put("type", "doc");
        content.put("version", 1);
        
        Map<String, Object> paragraph = new HashMap<>();
        paragraph.put("type", "paragraph");
        
        Map<String, Object> textContent = new HashMap<>();
        textContent.put("type", "text");
        textContent.put("text", text);
        
        paragraph.put("content", List.of(textContent));
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
     * Make a Jira API call with proper authentication
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
        
        // Build the URI
        URI uri = UriComponentsBuilder.fromUriString(url).build().toUri();
        
        // Create headers for the request
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("Authorization", "Basic " + encodedCredentials);
        headers.set("Accept", "application/json");
        headers.set("Content-Type", "application/json");
        
        // Create request entity
        RequestEntity<?> requestEntity;
        if (body != null) {
            // If there's a body, convert it to JSON and include it in the request
            String jsonBody = objectMapper.writeValueAsString(body);
            requestEntity = new RequestEntity<>(jsonBody, headers, method, uri);
        } else {
            // If no body, create request with headers only
            requestEntity = new RequestEntity<>(headers, method, uri);
        }
        
        // Make the API call
        ResponseEntity<String> response = restTemplate.exchange(requestEntity, String.class);
        
        // Parse and return the response
        return objectMapper.readTree(response.getBody());
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
}