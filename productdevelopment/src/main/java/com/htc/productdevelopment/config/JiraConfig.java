package com.htc.productdevelopment.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import java.time.Duration;
import org.springframework.context.annotation.Profile;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.htc.productdevelopment.service.JiraService;
import com.htc.productdevelopment.service.jira.JiraCoreService;
import com.htc.productdevelopment.service.jira.JiraProjectService;
import com.htc.productdevelopment.service.jira.JiraFieldService;

@Configuration
@Profile("!test")
public class JiraConfig {
    
    @Value("${jira.base-url}")
    private String baseUrl;
    
    @Value("${jira.email}")
    private String email;
    
    @Value("${jira.api-token}")
    private String apiToken;
    
    @Value("${jira.contract.project-key}")
    private String contractProjectKey;

    public String getContractProjectKey() {
        return contractProjectKey;
    }


    public String getBaseUrl() {
        return baseUrl;
    }

    public String getEmail() {
        return email;
    }

    public String getApiToken() {
        // Log a warning if the API token looks too short (might be invalid)
        if (apiToken != null && apiToken.length() < 20) {
            System.out.println("WARNING: Jira API token appears to be too short: " + apiToken);
        }
        return apiToken;
    }
    
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
            .setConnectTimeout(Duration.ofSeconds(30))
            .setReadTimeout(Duration.ofSeconds(30))
            .build();
    }
    
    // Removed objectMapper bean definition to avoid conflict with JacksonConfig
    
    @Bean
    public JiraCoreService jiraCoreService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        return new JiraCoreService(this, restTemplate, objectMapper);
    }
    
    @Bean
    public JiraFieldService jiraFieldService() {
        return new JiraFieldService();
    }
    
    @Bean
    public JiraProjectService jiraProjectService(JiraCoreService jiraCoreService) {
        return new JiraProjectService(this, jiraCoreService);
    }
    
    @Bean
    public JiraService jiraService(RestTemplate restTemplate, ObjectMapper objectMapper, 
                                  JiraCoreService jiraCoreService, JiraProjectService jiraProjectService, 
                                  JiraFieldService jiraFieldService) {
        return new JiraService(this, restTemplate, objectMapper, jiraCoreService, jiraProjectService, jiraFieldService);
    }
}