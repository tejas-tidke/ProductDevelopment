package com.htc.productdevelopment.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "contract_attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ContractAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Link to Contract
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private ContractDetails contract;

    // Link to Proposal (added later when proposal table is created)

    @Column(name = "jira_issue_key")
    private String jiraIssueKey;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "uploaded_by")
    private String uploadedBy;

    @Column(name = "stage")
    private String stage; // "CREATION", "FIRST_PROPOSAL", "FINAL_PROPOSAL"

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt = LocalDateTime.now();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id", nullable = true)
    private ContractProposal proposal;
    
    @Column(name = "mime_type")
    private String mimeType;

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }


}
