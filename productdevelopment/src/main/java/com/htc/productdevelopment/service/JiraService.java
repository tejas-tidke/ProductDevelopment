package com.htc.productdevelopment.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.htc.productdevelopment.config.JiraConfig;
import com.htc.productdevelopment.model.JiraProject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class JiraService {

    private final JiraConfig jiraConfig;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Get recent Jira projects (max 3)
     * @return List of recent Jira projects
     */
    public List<JiraProject> getRecentProjects() {
        try {
            // Use the recent projects endpoint
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/project/recent";
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            
            List<JiraProject> projects = new ArrayList<>();
            if (response.isArray()) {
                int count = 0;
                for (JsonNode projectNode : response) {
                    if (count >= 3) break; // Limit to 3 recent projects
                    
                    JiraProject project = new JiraProject();
                    project.setId(getTextValue(projectNode, "id"));
                    project.setKey(getTextValue(projectNode, "key"));
                    project.setName(getTextValue(projectNode, "name"));
                    project.setDescription(getTextValue(projectNode, "description"));
                    project.setProjectTypeKey(getTextValue(projectNode, "projectTypeKey"));
                    
                    // Extract project lead if available
                    JsonNode leadNode = projectNode.get("lead");
                    if (leadNode != null) {
                        String leadName = getTextValue(leadNode, "displayName");
                        project.setLead(leadName);
                        log.debug("Project {} has lead: {}", project.getKey(), leadName);
                    } else {
                        project.setLead(null);
                        log.debug("Project {} has no lead information", project.getKey());
                    }
                    
                    projects.add(project);
                    count++;
                }
            }
            
            return projects;
        } catch (Exception e) {
            log.error("Error fetching recent Jira projects", e);
            return Collections.emptyList();
        }
    }

    /**
     * Get all Jira projects
     * @return List of all Jira projects
     */
    public List<JiraProject> getAllProjects() {
        try {
            // Use the search projects endpoint
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/project/search";
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            
            List<JiraProject> projects = new ArrayList<>();
            JsonNode valuesNode = response.get("values");
            
            if (valuesNode != null && valuesNode.isArray()) {
                for (JsonNode projectNode : valuesNode) {
                    JiraProject project = new JiraProject();
                    project.setId(getTextValue(projectNode, "id"));
                    project.setKey(getTextValue(projectNode, "key"));
                    project.setName(getTextValue(projectNode, "name"));
                    project.setDescription(getTextValue(projectNode, "description"));
                    project.setProjectTypeKey(getTextValue(projectNode, "projectTypeKey"));
                    
                    // Extract project lead if available
                    JsonNode leadNode = projectNode.get("lead");
                    if (leadNode != null) {
                        String leadName = getTextValue(leadNode, "displayName");
                        project.setLead(leadName);
                        log.debug("Project {} has lead: {}", project.getKey(), leadName);
                    } else {
                        project.setLead(null);
                        log.debug("Project {} has no lead information. Lead node: {}", project.getKey(), leadNode);
                    }
                    
                    projects.add(project);
                }
            }
            
            return projects;
        } catch (Exception e) {
            log.error("Error fetching all Jira projects", e);
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
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/project/" + projectIdOrKey;
            JsonNode response = makeJiraApiCall(url, HttpMethod.GET, null);
            
            JiraProject project = new JiraProject();
            project.setId(getTextValue(response, "id"));
            project.setKey(getTextValue(response, "key"));
            project.setName(getTextValue(response, "name"));
            project.setDescription(getTextValue(response, "description"));
            project.setProjectTypeKey(getTextValue(response, "projectTypeKey"));
            
            // Extract project lead if available
            JsonNode leadNode = response.get("lead");
            if (leadNode != null) {
                String leadName = getTextValue(leadNode, "displayName");
                project.setLead(leadName);
                log.debug("Project {} has lead: {}", project.getKey(), leadName);
            } else {
                project.setLead(null);
                log.debug("Project {} has no lead information", project.getKey());
            }
            
            log.info("Project fetched successfully: {}", project);
            return project;
        } catch (Exception e) {
            log.error("Error fetching Jira project with ID/Key: {}", projectIdOrKey, e);
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
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/project";
            JsonNode response = makeJiraApiCall(url, HttpMethod.POST, projectData);
            log.info("Project created successfully: {}", response);
            return response;
        } catch (Exception e) {
            log.error("Error creating Jira project", e);
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
        // Create authorization header
        String credentials = jiraConfig.getEmail() + ":" + jiraConfig.getApiToken();
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
        
        // Build the URI using the new API
        URI uri = UriComponentsBuilder.fromUriString(url).build().toUri();
        
        // Create headers
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encodedCredentials);
        headers.set("Accept", "application/json");
        headers.set("Content-Type", "application/json");
        
        // Create request entity
        RequestEntity<?> requestEntity;
        if (body != null) {
            String jsonBody = objectMapper.writeValueAsString(body);
            requestEntity = new RequestEntity<>(jsonBody, headers, method, uri);
        } else {
            requestEntity = new RequestEntity<>(headers, method, uri);
        }
        
        // Make the API call
        ResponseEntity<String> response = restTemplate.exchange(requestEntity, String.class);
        
        // Parse the response
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