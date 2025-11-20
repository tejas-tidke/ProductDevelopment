package com.htc.productdevelopment.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
@Profile("!test")
public class JiraConfig {

    // Use default empty values so missing properties don't crash startup
    @Value("${jira.base-url:}")
    private String baseUrl;

    @Value("${jira.email:}")
    private String email;

    @Value("${jira.api-token:}")
    private String apiToken;

    @Value("${jira.contract.project-key:}")
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
        if (apiToken != null && !apiToken.isBlank() && apiToken.length() < 20) {
            System.out.println("WARNING: Jira API token appears to be too short: " + apiToken);
        }
        return apiToken;
    }

    /**
     * Convenience method to check if Jira is configured.
     */
    public boolean isConfigured() {
        return baseUrl != null && !baseUrl.isBlank()
                && email != null && !email.isBlank()
                && apiToken != null && !apiToken.isBlank();
    }

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
            .setConnectTimeout(Duration.ofSeconds(30))
            .setReadTimeout(Duration.ofSeconds(30))
            .build();
    }
}
