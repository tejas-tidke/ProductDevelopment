package com.htc.productdevelopment.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "quotes")
public class Quote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // OPTIONAL: link back to Jira issue if you want
    @Column(name = "jira_issue_key")
    private String jiraIssueKey;

    // Your original fields
    private String vendorName;

    private Double amount;

    private String currency;

    // If you're storing document URL (S3, local path, etc.)
    @Column(name = "file_url")
    private String fileUrl;

    // Optional: comments / notes from the form
    @Column(columnDefinition = "TEXT")
    private String remarks;

    private String createdBy;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", updatable = false)
    private Date createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = new Date();
    }
}
