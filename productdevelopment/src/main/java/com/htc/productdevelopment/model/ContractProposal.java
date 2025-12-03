package com.htc.productdevelopment.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "contract_proposals")
public class ContractProposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Link to contract_details table
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private ContractDetails contract;

    @Column(name = "jira_issue_key")
    private String jiraIssueKey;

    @Column(name = "proposal_number")
    private Integer proposalNumber;  // 1, 2, 3, FINAL

    @Column(name = "proposal_type")
    private String proposalType;  // FIRST, SECOND, THIRD, FINAL

    // License count entered in proposal (editable)
    @Column(name = "license_count")
    private Integer licenseCount;

    // Unit cost for this proposal
    @Column(name = "unit_cost")
    private Double unitCost;

    // Total cost (license_count * unit_cost)
    @Column(name = "total_cost")
    private Double totalCost;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "is_final")
    private Boolean isFinal;
    
    @Column(name = "is_final_submitted")
    private Boolean isFinalSubmitted = false;
    
    // Explicit getters to maintain expected method names
    public boolean isFinal() {
        return isFinal != null ? isFinal : false;
    }
    
    public boolean isFinalSubmitted() {
        return isFinalSubmitted != null ? isFinalSubmitted : false;
    }
    
    // Explicit setters to maintain expected method names
    public void setFinal(Boolean isFinal) {
        this.isFinal = isFinal;
    }
    
    public void setFinalSubmitted(Boolean isFinalSubmitted) {
        this.isFinalSubmitted = isFinalSubmitted;
    }
}
