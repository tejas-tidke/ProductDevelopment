package com.htc.productdevelopment.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_departments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDepartment {

    @EmbeddedId
    private UserDepartmentId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("departmentId")
    private Department department;
}
