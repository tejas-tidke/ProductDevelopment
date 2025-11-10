package com.htc.productdevelopment.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import java.time.Duration;

@Configuration
public class JiraConfig {
    
    @Value("${jira.base-url}")
    private String baseUrl;
    
    @Value("${jira.email}")
    private String email;
    
    @Value("${jira.api-token}")
    private String apiToken;

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
}