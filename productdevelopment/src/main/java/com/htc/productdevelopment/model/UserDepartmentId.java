package com.htc.productdevelopment.model;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDepartmentId implements Serializable {

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "department_id")
    private Integer departmentId;
}
