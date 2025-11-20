package com.htc.productdevelopment.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import lombok.Getter;

@Configuration
@Getter
public class JiraFieldConfig {

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
}