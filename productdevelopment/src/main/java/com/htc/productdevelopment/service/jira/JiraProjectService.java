package com.htc.productdevelopment.service.jira;

import com.fasterxml.jackson.databind.JsonNode;
import com.htc.productdevelopment.config.JiraConfig;
import com.htc.productdevelopment.model.JiraProject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class JiraProjectService {

    private static final Logger logger = LoggerFactory.getLogger(JiraProjectService.class);

    private final JiraConfig jiraConfig;
    private final JiraCoreService jiraCoreService;

    public JiraProjectService(JiraConfig jiraConfig, JiraCoreService jiraCoreService) {
        this.jiraConfig = jiraConfig;
        this.jiraCoreService = jiraCoreService;
    }

    public List<JiraProject> getRecentProjects() {
        try {
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/project/recent?maxResults=3";
            JsonNode response = jiraCoreService.makeJiraApiCall(url, HttpMethod.GET, null);
            List<JiraProject> projects = parseProjectsResponse(response);
            if (projects.size() > 3) {
                projects = projects.subList(0, 3);
            }
            return projects;
        } catch (Exception e) {
            logger.error("Error fetching recent Jira projects", e);
            return List.of();
        }
    }

    public List<JiraProject> getAllProjects() {
        try {
            String url = jiraConfig.getBaseUrl() + "/rest/api/3/project";
            JsonNode response = jiraCoreService.makeJiraApiCall(url, HttpMethod.GET, null);
            return parseProjectsResponse(response);
        } catch (Exception e) {
            logger.error("Error fetching all Jira projects", e);
            return List.of();
        }
    }

    public JiraProject getProjectByKey(String projectKey) throws Exception {
        String url = jiraConfig.getBaseUrl() + "/rest/api/3/project/" + projectKey;
        JsonNode response = jiraCoreService.makeJiraApiCall(url, HttpMethod.GET, null);
        return parseProject(response);
    }

    public JsonNode createProject(Map<String, Object> projectData) throws Exception {
        String url = jiraConfig.getBaseUrl() + "/rest/api/3/project";
        return jiraCoreService.makeJiraApiCall(url, HttpMethod.POST, projectData);
    }

    public JsonNode deleteProject(String projectKey) throws Exception {
        String url = jiraConfig.getBaseUrl() + "/rest/api/3/project/" + projectKey;
        return jiraCoreService.makeJiraApiCall(url, HttpMethod.DELETE, null);
    }

    public JsonNode getProjectFields(String projectIdOrKey) throws Exception {
        String url = jiraConfig.getBaseUrl() + "/rest/api/3/project/" + projectIdOrKey + "/properties";
        return jiraCoreService.makeJiraApiCall(url, HttpMethod.GET, null);
    }

    // --- helpers ---

    private List<JiraProject> parseProjectsResponse(JsonNode response) {
        List<JiraProject> projects = new ArrayList<>();
        if (response == null) {
            return projects;
        }
        if (response.isArray()) {
            for (JsonNode projectNode : response) {
                projects.add(parseProject(projectNode));
            }
        }
        return projects;
    }

    private JiraProject parseProject(JsonNode projectNode) {
        if (projectNode == null) return null;
        JiraProject project = new JiraProject();
        project.setProjectId(getTextValue(projectNode, "id"));
        project.setKey(getTextValue(projectNode, "key"));
        project.setName(getTextValue(projectNode, "name"));
        project.setDescription(getTextValue(projectNode, "description"));
        project.setProjectTypeKey(getTextValue(projectNode, "projectTypeKey"));

        JsonNode leadNode = projectNode.path("lead");
        if (leadNode != null && !leadNode.isMissingNode()) {
            String leadName = getTextValue(leadNode, "displayName");
            project.setLeadName(leadName);
        }

        return project;
    }

    private String getTextValue(JsonNode node, String fieldName) {
        JsonNode fieldNode = node.get(fieldName);
        return fieldNode != null ? fieldNode.asText() : null;
    }
}

