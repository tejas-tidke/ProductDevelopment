package com.htc.productdevelopment.model;

import jakarta.persistence.*;

@Entity
@Table(name = "jira_projects")
public class JiraProject {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "project_id", unique = true)
    private String projectId;
    
    @Column(name = "key", unique = true)
    private String key;
    
    @Column(name = "name")
    private String name;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "project_type_key")
    private String projectTypeKey;
    
    @Column(name = "lead")
    private String lead;
    
    // Constructors
    public JiraProject() {}
    
    public JiraProject(String projectId, String key, String name, String description, 
                      String projectTypeKey, String lead) {
        this.projectId = projectId;
        this.key = key;
        this.name = name;
        this.description = description;
        this.projectTypeKey = projectTypeKey;
        this.lead = lead;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getProjectId() {
        return projectId;
    }
    
    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }
    
    public String getKey() {
        return key;
    }
    
    public void setKey(String key) {
        this.key = key;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getProjectTypeKey() {
        return projectTypeKey;
    }
    
    public void setProjectTypeKey(String projectTypeKey) {
        this.projectTypeKey = projectTypeKey;
    }
    
    public String getLead() {
        return lead;
    }
    
    public void setLead(String lead) {
        this.lead = lead;
    }
    
    @Override
    public String toString() {
        return "JiraProject{" +
                "id=" + id +
                ", projectId='" + projectId + '\'' +
                ", key='" + key + '\'' +
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", projectTypeKey='" + projectTypeKey + '\'' +
                ", lead='" + lead + '\'' +
                '}';
    }
}