package com.htc.productdevelopment.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "contract_details")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ContractDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // -------------------------
    // Contract Type
    // -------------------------
    @Column(name = "contract_type", length = 20)
    private String contractType; // "new" or "existing"

 // NEW FIELD — Used for Procurement-Renewal filtering
    @Column(name = "renewal_status", length = 50)
    private String renewalStatus;

    
    @Column(name = "jira_issue_key")
    private String jiraIssueKey;
    
    // -------------------------
    // Vendor & Product
    // -------------------------
    @Column(name = "name_of_vendor", nullable = false)
    private String nameOfVendor;

    @Column(name = "product_name", nullable = false)
    private String productName;

    // -------------------------
    // Contract Dates
    // -------------------------
    @Column(name = "contract_start_date")
    private LocalDate contractStartDate;

    @Column(name = "contract_end_date")
    private LocalDate contractEndDate;

    // -------------------------
    // Billing Details
    // -------------------------
    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "vendor_contract_type", length = 50)
    private String vendorContractType;

    // -------------------------
    // Comments
    // -------------------------
    @Column(name = "additional_comment", columnDefinition = "TEXT")
    private String additionalComment;

    // -------------------------
    // Requester Details
    // -------------------------
    @Column(name = "requester_name", length = 255)
    private String requesterName;

    @Column(name = "requester_mail", length = 255)
    private String requesterMail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id")
    @JsonIgnore
    private User requester;

    @Column(name = "requester_department")
    private String requesterDepartment;

    @Column(name = "requester_organization")
    private String requesterOrganization;

    // ============================================
    // 🔥 NEW FIELDS — Required for Filtering Logic
    // ============================================

    @Column(name = "requester_department_id")
    private Long requesterDepartmentId;

    @Column(name = "requester_organization_id")
    private Long requesterOrganizationId;

    // ============================================
    // Current Contract Values
    // ============================================
    @Column(name = "current_license_count")
    private Integer currentLicenseCount;

    @Column(name = "current_usage_count")
    private Integer currentUsageCount;

    @Column(name = "current_units")
    private String currentUnits;

    // ============================================
    // New/Requested Values
    // ============================================
    @Column(name = "new_license_count")
    private Integer newLicenseCount;

    @Column(name = "new_usage_count")
    private Integer newUsageCount;

    @Column(name = "new_units")
    private String newUnits;

    // ============================================
    // Dates for Vendor Module
    // ============================================
    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "renewal_date")
    private LocalDate renewalDate;

    @Column(name = "attachments", columnDefinition = "TEXT")
    private String attachments;
    
 // ⭐ New field to store attachment metadata JSON
    @Column(name = "attachment_metadata", columnDefinition = "TEXT")
    private String attachmentMetadata;
    
    // ============================================
    // Additional Fields for RequestSplitView
    // ============================================
    
    @Column(name = "license_update_type")
    private String licenseUpdateType;
    
    @Column(name = "existing_contract_id")
    private String existingContractId;
    
    @Column(name = "billing_type")
    private String billingType;
    
    public String getJiraIssueKey() {
        return jiraIssueKey;
    }

    public void setJiraIssueKey(String jiraIssueKey) {
        this.jiraIssueKey = jiraIssueKey;
    }
    
    public Integer getQuantity() {
        return quantity;
    }
    
    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
    
    public String getContractType() {
        return contractType;
    }

    public void setContractType(String contractType) {
        this.contractType = contractType;
    }

}
