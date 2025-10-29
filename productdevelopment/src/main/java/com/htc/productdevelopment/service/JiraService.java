package com.htc.productdevelopment.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.htc.productdevelopment.config.JiraConfig;
import com.htc.productdevelopment.model.JiraProject;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Service class for interacting with Jira API
 * This service handles all Jira-related operations like fetching projects and issues
 */
@Service
public class JiraService {

    // Logger for tracking service operations
    private static final Logger logger = LoggerFactory.getLogger(JiraService.class);
    
    // Configuration and utilities
    private final JiraConfig jiraConfig;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Constructor to initialize dependencies
     * @param jiraConfig Configuration containing Jira credentials
     * @param restTemplate HTTP client for making API requests
     */
    public JiraService(JiraConfig jiraConfig, RestTemplate restTemplate) {
        this.jiraConfig = jiraConfig;
        this.restTemplate = restTemplate;
    }

    /**
     * Get recent Jira projects (limited to 3)
     * @return List of recent Jira projects
     */
    public List<JiraProject> getRecentProjects() {
        try {
            logger.info("Fetching recent Jira projects");
            
            // Build the API URL for recent projects
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/project/recent";
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            
            // Process the response and create project objects
            List<JiraProject> projects = new ArrayList<>();
            if (response.isArray()) {
                int count = 0;
                for (JsonNode projectNode : response) {
                    // Limit to 3 recent projects
                    if (count >= 3) break;
                    
                    // Create a new project object and populate its fields
                    JiraProject project = new JiraProject();
                    project.setId(getTextValue(projectNode, "id"));
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
                    count++;
                }
            }
            
            logger.info("Successfully fetched {} recent projects", projects.size());
            return projects;
        } catch (Exception e) {
            logger.error("Error fetching recent Jira projects", e);
            return Collections.emptyList();
        }
    }

    /**
     * Get all Jira projects
     * @return List of all Jira projects
     */
    public List<JiraProject> getAllProjects() {
        try {
            logger.info("Fetching all Jira projects");
            
            // Build the API URL for searching projects
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/project/search";
            
            // Make the API call
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            
            // Process the response and create project objects
            List<JiraProject> projects = new ArrayList<>();
            JsonNode valuesNode = response.get("values");
            
            if (valuesNode != null && valuesNode.isArray()) {
                for (JsonNode projectNode : valuesNode) {
                    // Create a new project object and populate its fields
                    JiraProject project = new JiraProject();
                    project.setId(getTextValue(projectNode, "id"));
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
            
            logger.info("Successfully fetched {} projects", projects.size());
            return projects;
        } catch (Exception e) {
            logger.error("Error fetching all Jira projects", e);
            return Collections.emptyList();
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
            project.setId(getTextValue(response, "id"));
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
                    "assignee"
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
        HttpHeaders headers = new HttpHeaders();
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
}