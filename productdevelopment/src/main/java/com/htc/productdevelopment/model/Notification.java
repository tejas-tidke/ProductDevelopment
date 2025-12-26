package com.htc.productdevelopment.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonFormat;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notifications")
public class Notification {
    
    @Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "title", nullable = false)
    private String title;
    
    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;
    
    @Column(name = "issue_key")
    private String issueKey;
    
    @Column(name = "created_at", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;
    
    // Recipient filtering fields
    @Column(name = "recipient_user_id")
    private Long recipientUserId;
    
    @Column(name = "recipient_role")
    private String recipientRole;
    
    @Column(name = "recipient_department_id")
    private Long recipientDepartmentId;
    
    @Column(name = "recipient_organization_id")
    private Long recipientOrganizationId;
    
    // Sender information
    @Column(name = "sender_user_id")
    private Long senderUserId;
    
    @Column(name = "sender_name")
    private String senderName;
    
    // Status transition information
    @Column(name = "from_status")
    private String fromStatus;
    
    @Column(name = "to_status")
    private String toStatus;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isRead == null) {
            isRead = false;
        }
    }
}