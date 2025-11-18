package com.htc.productdevelopment.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;

import com.htc.productdevelopment.model.Department;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_user_uid", columnList = "uid"),
        @Index(name = "idx_user_email", columnList = "email"),
        @Index(name = "idx_user_role", columnList = "role"),
        @Index(name = "idx_user_active", columnList = "active")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String uid;   // Firebase UID

    @Column(unique = true)
    private String email;

    private String name;

    // ---------- 🔥 Department Relation ----------
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;
    // --------------------------------------------

    @Column(columnDefinition = "LONGTEXT")
    private String avatar;

    @Enumerated(EnumType.STRING)
    private Role role;

    public enum Role {
        SUPER_ADMIN,
        ADMIN,
        APPROVER,
        REQUESTER
    }

    @Column(nullable = false)
    private Boolean active = true;
    
    @Column(name = "organization")
    private String organization;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at")
    private Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = new Date();
    }
}