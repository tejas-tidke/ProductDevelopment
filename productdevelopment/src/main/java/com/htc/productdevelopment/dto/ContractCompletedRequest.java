package com.htc.productdevelopment.dto;

import lombok.Data;

@Data
public class ContractCompletedRequest {
    private String issueKey;
    private String transitionKey;

    private String nameOfVendor;
    private String productName;
    private String requesterName;
    private String requesterMail;
    private String requesterDepartment;
    private String requesterOrganization;

    private Integer currentLicenseCount;
    private Integer currentUsageCount;
    private String currentUnits;

    private Integer newLicenseCount;
    private Integer newUsageCount;
    private String newUnits;

    private String additionalComment;
    private String vendorContractType;
    private String licenseUpdateType;
    private String existingContractId;
    private String billingType;

    private String dueDate;
    private String renewalDate;
    private String contractDuration;
}

