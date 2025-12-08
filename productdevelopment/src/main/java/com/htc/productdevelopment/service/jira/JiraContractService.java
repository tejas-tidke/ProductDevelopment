package com.htc.productdevelopment.service.jira;

import com.fasterxml.jackson.databind.JsonNode;
import com.htc.productdevelopment.config.JiraConfig;
import com.htc.productdevelopment.service.jira.JiraCoreService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;

@Service
public class JiraContractService {
    
    private static final Logger logger = LoggerFactory.getLogger(JiraContractService.class);
    
    private final JiraConfig jiraConfig;
    private final JiraCoreService jiraCoreService;
    
    public JiraContractService(JiraConfig jiraConfig, JiraCoreService jiraCoreService) {
        this.jiraConfig = jiraConfig;
        this.jiraCoreService = jiraCoreService;
    }
    
    // Contract-specific Jira methods will be moved here from JiraService
    
}