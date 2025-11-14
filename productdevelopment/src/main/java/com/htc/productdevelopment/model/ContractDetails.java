package com.htc.productdevelopment.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

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
    // Vendor & Product
    // -------------------------
    @Column(name = "name_of_vendor", nullable = false)
    private String nameOfVendor;

    @Column(name = "product_name", nullable = false)
    private String productName;

    // -------------------------
    // Contract Dates (Existing)
    // -------------------------
    @Column(name = "contract_start_date")
    private LocalDate contractStartDate;

    @Column(name = "contract_end_date")
    private LocalDate contractEndDate;

    // -------------------------
    // Billing Details (Existing)
    // -------------------------
    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "unit", length = 50)
    private String unit; // credits/minutes/others

    @Column(name = "vendor_contract_type", length = 50)
    private String vendorContractType; // usage or license

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

    // ============================================
    // ✅ NEW FIELDS REQUIRED BY JiraService + DTO
    // ============================================

    // ---- Current Contract Values ----
    @Column(name = "current_license_count")
    private Integer currentLicenseCount;

    @Column(name = "current_usage_count")
    private Integer currentUsageCount;

    @Column(name = "current_units")
    private String currentUnits;

    // ---- New/Requested Values ----
    @Column(name = "new_license_count")
    private Integer newLicenseCount;

    @Column(name = "new_usage_count")
    private Integer newUsageCount;

    @Column(name = "new_units")
    private String newUnits;

    // ---- Dates used in Vendor Module ----
    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "renewal_date")
    private LocalDate renewalDate;
}
