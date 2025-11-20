package com.htc.productdevelopment.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateQuoteRequest {

    private String issueKey;       // e.g. "REQ-123"
    private String proposalType;   // "FIRST" | "SECOND" | "THIRD" | "FINAL"

    private Integer licenseCount;  // from Jira custom field
    private BigDecimal unitCost;
    private BigDecimal totalCost;

    private Integer attachmentsCount; // number of attached files in UI
}
