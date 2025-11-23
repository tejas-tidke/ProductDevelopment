package com.htc.productdevelopment.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "proposals")
public class Proposal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "proposal_type")
    private String proposalType;

    @Column(name = "license_count")
    private String licenseCount;

    @Column(name = "unit_cost")
    private String unitCost;

    @Column(name = "total_cost")
    private String totalCost;

    @Column(name = "attachment_ids", columnDefinition = "TEXT")
    private String attachmentIds;

    @Column(name = "issue_key")
    private String issueKey;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}