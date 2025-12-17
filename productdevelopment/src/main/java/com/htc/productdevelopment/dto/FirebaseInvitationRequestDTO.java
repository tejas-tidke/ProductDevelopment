package com.htc.productdevelopment.dto;

public class FirebaseInvitationRequestDTO {
    private String email;
    private String role;
    private Long departmentId;
    private Long organizationId;
    private String invitedBy;

    // Default constructor
    public FirebaseInvitationRequestDTO() {}

    // Constructor with all fields
    public FirebaseInvitationRequestDTO(String email, String role, Long departmentId, Long organizationId, String invitedBy) {
        this.email = email;
        this.role = role;
        this.departmentId = departmentId;
        this.organizationId = organizationId;
        this.invitedBy = invitedBy;
    }

    // Getters and setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(Long departmentId) {
        this.departmentId = departmentId;
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(Long organizationId) {
        this.organizationId = organizationId;
    }

    public String getInvitedBy() {
        return invitedBy;
    }

    public void setInvitedBy(String invitedBy) {
        this.invitedBy = invitedBy;
    }
}