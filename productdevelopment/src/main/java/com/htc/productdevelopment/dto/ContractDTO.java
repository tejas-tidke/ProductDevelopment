package com.htc.productdevelopment.dto;

import lombok.Data;

@Data
public class ContractDTO {

    private Long id;

    private String nameOfVendor;         // vendorName
    private String productName;

    private String requesterName;
    private String requesterEmail;       // requesterMail
    private String requesterDepartment;

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
}
