package com.htc.productdevelopment.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProposalDTO {
    private String proposalType;
    private String licenseCount;
    private String unitCost;
    private String totalCost;
    private String attachmentIds;
    private String issueKey;
}