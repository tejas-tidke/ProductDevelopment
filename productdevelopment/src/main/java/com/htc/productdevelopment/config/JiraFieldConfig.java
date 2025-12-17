package com.htc.productdevelopment.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import lombok.Getter;

@Configuration
@Getter
public class JiraFieldConfig {

	 private final String organizationName = "Organization";  // Used in JQL only
	 private final String departmentName = "Department";  
	
    // 🔹 Contract-level metadata
    @Value("${jira.customfield.contractType}")
    private String contractType;               // new / existing
    @Value("${jira.customfield.existingContractId}")
    private String existingContractId;         // contract ID (text)
    @Value("${jira.customfield.licenseUpdateType}")
    private String licenseUpdateType;          // upgrade / downgrade (text)

    // 🔹 Vendor + Product info
    @Value("${jira.customfield.vendorName}")
    private String vendorName;                 // text field
    @Value("${jira.customfield.productName}")
    private String productName;                // text field

    // 🔹 Billing Type (usage / license)
    @Value("${jira.customfield.billingType}")
    private String billingType;

    // 🔹 Current contract values (stored as *text*, not numbers)
    @Value("${jira.customfield.currentLicenseCount}")
    private String currentLicenseCount;
    @Value("${jira.customfield.currentUsageCount}")
    private String currentUsageCount;
    @Value("${jira.customfield.currentUnit}")
    private String currentUnit;

    // 🔹 New renewal values (also stored as *text*)
    @Value("${jira.customfield.newLicenseCount}")
    private String newLicenseCount;
    @Value("${jira.customfield.newUsageCount}")
    private String newUsageCount;
    @Value("${jira.customfield.newUnit}")
    private String newUnit;

    // 🔹 Dates (but stored as text in Jira, not date type)
    @Value("${jira.customfield.dueDate}")
    private String dueDate;
    @Value("${jira.customfield.renewalDate}")
    private String renewalDate;

    // 🔹 Requester metadata
    @Value("${jira.customfield.requesterName}")
    private String requesterName;
    @Value("${jira.customfield.requesterEmail}")
    private String requesterEmail;
    @Value("${jira.customfield.department}")
    private String department;
    @Value("${jira.customfield.organization}")
    private String organization;

    // 🔹 Comments (paragraph field)
    @Value("${jira.customfield.additionalComment}")
    private String additionalComment;
    

    // 🔹 Total Profit
    @Value("${jira.customfield.totalprofit}")
    private String totalprofit;
    
    // 🔹 Total Optimized Cost
    @Value("${jira.customfield.totaloptimizedcost}")
    private String totaloptimizedcost;

    // 🔹 Contract Duration
    @Value("${jira.customfield.contractDuration}")
    private String contractDuration;

    public String getOrganizationName() {
        return organizationName;
    }

    public String getDepartmentName() {
        return departmentName;
    }
    
    public String getTotalprofit() {
        return totalprofit;
    }
    
    public String getTotaloptimizedcost() {
        return totaloptimizedcost;
    }
    
    // Add missing getter methods for Jira custom fields
    public String getContractType() {
        return contractType;
    }
    
    public String getExistingContractId() {
        return existingContractId;
    }
    
    public String getLicenseUpdateType() {
        return licenseUpdateType;
    }
    
    public String getVendorName() {
        return vendorName;
    }
    
    public String getProductName() {
        return productName;
    }
    
    public String getBillingType() {
        return billingType;
    }
    
    public String getCurrentLicenseCount() {
        return currentLicenseCount;
    }
    
    public String getCurrentUsageCount() {
        return currentUsageCount;
    }
    
    public String getCurrentUnit() {
        return currentUnit;
    }
    
    public String getNewLicenseCount() {
        return newLicenseCount;
    }
    
    public String getNewUsageCount() {
        return newUsageCount;
    }
    
    public String getNewUnit() {
        return newUnit;
    }
    
    public String getDueDate() {
        return dueDate;
    }
    
    public String getRenewalDate() {
        return renewalDate;
    }
    
    public String getRequesterName() {
        return requesterName;
    }
    
    public String getRequesterEmail() {
        return requesterEmail;
    }
    
    public String getDepartment() {
        return department;
    }
    
    public String getOrganization() {
        return organization;
    }
    
    public String getAdditionalComment() {
        return additionalComment;
    }
    
    public String getContractDuration() {
        return contractDuration;
    }
}