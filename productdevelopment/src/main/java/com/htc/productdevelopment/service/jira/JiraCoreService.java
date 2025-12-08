package com.htc.productdevelopment.service.jira;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.htc.productdevelopment.config.JiraConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Core Jira HTTP client: builds auth headers and executes HTTP calls.
 */
@Service
public class JiraCoreService {

    private static final Logger logger = LoggerFactory.getLogger(JiraCoreService.class);

    private final JiraConfig jiraConfig;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public JiraCoreService(JiraConfig jiraConfig, RestTemplate restTemplate, ObjectMapper objectMapper) {
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
     * Execute a Jira API call with auth headers and JSON parsing.
     */
    public JsonNode makeJiraApiCall(String url, HttpMethod method, Object body) throws Exception {
        logger.info("Calling Jira API: {} {}", method, url);

        URI uri = new URI(url);
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", getAuthHeader());
        headers.set("Accept", "application/json");

        // For attachments, do not set Content-Type and add X-Atlassian-Token
        if (url.contains("/attachments")) {
            headers.set("X-Atlassian-Token", "no-check");
        } else {
            headers.set("Content-Type", "application/json");
        }

        RequestEntity<?> requestEntity;
        if (body != null) {
            if (body instanceof org.springframework.util.MultiValueMap) {
                requestEntity = new RequestEntity<>(
                    (org.springframework.util.MultiValueMap<String, Object>) body,
                    headers,
                    method,
                    uri
                );
            } else {
                requestEntity = new RequestEntity<>(body, headers, method, uri);
            }
        } else {
            requestEntity = new RequestEntity<>(headers, method, uri);
        }

        try {
            ResponseEntity<String> response = restTemplate.exchange(requestEntity, String.class);
            String responseBody = response.getBody();

            if (responseBody == null || responseBody.isEmpty()) {
                return objectMapper.readTree("{}");
            }
            return objectMapper.readTree(responseBody);
        } catch (Exception e) {
            logger.error("Error calling Jira API {} {}: {}", method, url, e.getMessage(), e);
            throw new Exception("Failed to connect to Jira API: " + e.getMessage(), e);
        }
    }
}

