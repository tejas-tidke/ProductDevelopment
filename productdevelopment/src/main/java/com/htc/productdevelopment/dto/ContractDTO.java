package com.htc.productdevelopment.dto;

import lombok.Data;

@Data
public class ContractDTO {

    private Long id;

    // Original fields
    private String contractType;     // new | existing
    private String renewalStatus;    // ⭐ NEW → completed
    private String jiraIssueKey;

    private String nameOfVendor;
    private String productName;

    private String requesterName;
    private String requesterEmail;
    private String requesterDepartment;
    private String requesterOrganization;

    private String vendorContractType;
    private String additionalComment;

    private Integer currentLicenseCount;
    private Integer currentUsageCount;
    private String currentUnits;

    private Integer newLicenseCount;
    private Integer newUsageCount;
    private String newUnits;

    private String dueDate;
    private String renewalDate;

    // Additional fields for RequestSplitView
    private String licenseUpdateType;
    private String existingContractId;
    private String billingType;
}
