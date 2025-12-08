package com.htc.productdevelopment.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.htc.productdevelopment.config.JiraConfig;
import com.htc.productdevelopment.model.ContractDetails;
import com.htc.productdevelopment.repository.ContractDetailsRepository;
import com.htc.productdevelopment.service.jira.JiraCoreService;
import com.htc.productdevelopment.service.jira.JiraProjectService;
import com.htc.productdevelopment.service.jira.JiraFieldService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JiraServiceTest {

    @Mock
    private JiraConfig jiraConfig;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private ContractDetailsRepository contractDetailsRepository;

    @Mock
    private JiraCoreService jiraCoreService;

    @Mock
    private JiraProjectService jiraProjectService;

    @Mock
    private JiraFieldService jiraFieldService;

    @InjectMocks
    private JiraService jiraService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        // Initialize the service with mocked dependencies
        jiraService = new JiraService(jiraConfig, restTemplate, objectMapper, jiraCoreService, jiraProjectService, jiraFieldService);
        
        // Use reflection to set the private contractDetailsRepository field
        try {
            java.lang.reflect.Field field = JiraService.class.getDeclaredField("contractDetailsRepository");
            field.setAccessible(true);
            field.set(jiraService, contractDetailsRepository);
        } catch (Exception e) {
            fail("Failed to set contractDetailsRepository via reflection: " + e.getMessage());
        }
    }

    @Test
    void testSaveContractDetailsForCompletedIssue() throws Exception {
        // Prepare test data
        Map<String, Object> vendorDetails = new HashMap<>();
        vendorDetails.put("vendorName", "Test Vendor");
        vendorDetails.put("productName", "Test Product");
        vendorDetails.put("vendorContractType", "License");
        vendorDetails.put("requesterName", "John Doe");
        vendorDetails.put("requesterMail", "john.doe@example.com");
        vendorDetails.put("department", "IT");
        vendorDetails.put("organization", "Test Org");
        vendorDetails.put("additionalComment", "Test comment");
        vendorDetails.put("dueDate", "2023-12-31");
        vendorDetails.put("renewalDate", "2024-12-31");
        vendorDetails.put("currentLicenseCount", "10");
        vendorDetails.put("currentUsageCount", "5");
        vendorDetails.put("currentUnits", "Licenses");
        vendorDetails.put("newLicenseCount", "15");
        vendorDetails.put("newUsageCount", "8");
        vendorDetails.put("newUnits", "Licenses");

        // Mock the save operation
        ContractDetails savedContract = new ContractDetails();
        savedContract.setId(1L);
        when(contractDetailsRepository.save(any(ContractDetails.class))).thenReturn(savedContract);

        // Use reflection to access the private method
        java.lang.reflect.Method method = JiraService.class.getDeclaredMethod(
            "saveContractDetailsForCompletedIssue", Map.class);
        method.setAccessible(true);

        // Execute the method
        method.invoke(jiraService, vendorDetails);

        // Verify that the save method was called
        verify(contractDetailsRepository, times(1)).save(any(ContractDetails.class));
    }

    @Test
    void testGetIssueStatus() throws Exception {
        // Prepare test data
        String issueKey = "TEST-123";
        String expectedStatus = "Completed";

        // Mock the getIssueByIdOrKey method
        JsonNode mockIssue = mock(JsonNode.class);
        JsonNode mockFields = mock(JsonNode.class);
        JsonNode mockStatus = mock(JsonNode.class);
        JsonNode mockStatusName = mock(JsonNode.class);

        when(jiraService.getIssueByIdOrKey(issueKey)).thenReturn(mockIssue);
        when(mockIssue.path("fields")).thenReturn(mockFields);
        when(mockFields.path("status")).thenReturn(mockStatus);
        when(mockStatus.path("name")).thenReturn(mockStatusName);
        when(mockStatusName.asText()).thenReturn(expectedStatus);

        // Use reflection to access the private method
        java.lang.reflect.Method method = JiraService.class.getDeclaredMethod(
            "getIssueStatus", String.class);
        method.setAccessible(true);

        // Execute the method
        String actualStatus = (String) method.invoke(jiraService, issueKey);

        // Verify the result
        assertEquals(expectedStatus, actualStatus);
    }
}