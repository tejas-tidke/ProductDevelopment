package com.htc.productdevelopment.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "jira_issues")
public class JiraIssue {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "issue_id", unique = true)
    private String issueId;
    
    @Column(name = "key", unique = true)
    private String key;
    
    @Column(name = "summary")
    private String summary;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "issue_type")
    private String issueType;
    
    @Column(name = "project_key")
    private String projectKey;
    
    @Column(name = "reporter")
    private String reporter;
    
    @Column(name = "assignee")
    private String assignee;
    
    @Column(name = "status")
    private String status;
    
    @Column(name = "priority")
    private String priority;
    
    @Column(name = "due_date")
    private LocalDate dueDate;
    
    // Constructors
    public JiraIssue() {}
    
    public JiraIssue(String issueId, String key, String summary, String description, 
                     String issueType, String projectKey, String reporter, String assignee,
                     String status, String priority, LocalDate dueDate) {
        this.issueId = issueId;
        this.key = key;
        this.summary = summary;
        this.description = description;
        this.issueType = issueType;
        this.projectKey = projectKey;
        this.reporter = reporter;
        this.assignee = assignee;
        this.status = status;
        this.priority = priority;
        this.dueDate = dueDate;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getIssueId() {
        return issueId;
    }
    
    public void setIssueId(String issueId) {
        this.issueId = issueId;
    }
    
    public String getKey() {
        return key;
    }
    
    public void setKey(String key) {
        this.key = key;
    }
    
    public String getSummary() {
        return summary;
    }
    
    public void setSummary(String summary) {
        this.summary = summary;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getIssueType() {
        return issueType;
    }
    
    public void setIssueType(String issueType) {
        this.issueType = issueType;
    }
    
    public String getProjectKey() {
        return projectKey;
    }
    
    public void setProjectKey(String projectKey) {
        this.projectKey = projectKey;
    }
    
    public String getReporter() {
        return reporter;
    }
    
    public void setReporter(String reporter) {
        this.reporter = reporter;
    }
    
    public String getAssignee() {
        return assignee;
    }
    
    public void setAssignee(String assignee) {
        this.assignee = assignee;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getPriority() {
        return priority;
    }
    
    public void setPriority(String priority) {
        this.priority = priority;
    }
    
    public LocalDate getDueDate() {
        return dueDate;
    }
    
    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }
    
    @Override
    public String toString() {
        return "JiraIssue{" +
                "id=" + id +
                ", issueId='" + issueId + '\'' +
                ", key='" + key + '\'' +
                ", summary='" + summary + '\'' +
                ", description='" + description + '\'' +
                ", issueType='" + issueType + '\'' +
                ", projectKey='" + projectKey + '\'' +
                ", reporter='" + reporter + '\'' +
                ", assignee='" + assignee + '\'' +
                ", status='" + status + '\'' +
                ", priority='" + priority + '\'' +
                ", dueDate=" + dueDate +
                '}';
    }
}