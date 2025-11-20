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
@Table(
    name = "users",
    indexes = {
        @Index(name = "idx_user_uid", columnList = "uid"),
        @Index(name = "idx_user_email", columnList = "email"),
        @Index(name = "idx_user_role", columnList = "role"),
        @Index(name = "idx_user_active", columnList = "active")
    }
)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Firebase UID
    @Column(unique = true)
    private String uid;

    @Column(unique = true, nullable = false)
    private String email;

    private String name;

    // ---------- 🔥 Department Relation ----------
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;
    // --------------------------------------------

    // Avatar image URL / base64 / JSON etc.
    @Lob
    @Column(columnDefinition = "TEXT")
    private String avatar;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    public enum Role {
        SUPER_ADMIN,
        ADMIN,
        APPROVER,
        REQUESTER
    }

    @Column(nullable = false)
    private Boolean active = true;

    // ---------- 🔥 Organization Relation ----------
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organization_id")
    private Organization organization;
    // --------------------------------------------

    // Plain text organization name (e.g. "Holograph")
    @Column(name = "organization_name")
    private String organizationName;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "approved")
    private Boolean approved = false;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", updatable = false)
    private Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt;

    @PrePersist
    protected void onCreate() {
        Date now = new Date();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = new Date();
    }
}
