package com.htc.productdevelopment.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "invitations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Invitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String role;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "organization")
    private String organization;
    
    @Column(name = "invited_by")
    private String invitedBy;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private boolean used = false;

    @Column(nullable = false)
    private boolean sent = false;
    
    // Explicit getters for boolean fields
    public boolean isUsed() {
        return used;
    }
    
    public boolean isSent() {
        return sent;
    }
    
    // Explicit setters for boolean fields
    public void setUsed(boolean used) {
        this.used = used;
    }
    
    public void setSent(boolean sent) {
        this.sent = sent;
    }
}