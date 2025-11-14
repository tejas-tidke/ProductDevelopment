package com.htc.productdevelopment.repository;

import com.htc.productdevelopment.model.UserDepartment;
import com.htc.productdevelopment.model.UserDepartmentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UserDepartmentRepository extends JpaRepository<UserDepartment, UserDepartmentId> {

    @Query("""
        SELECT d.name 
        FROM UserDepartment ud 
        JOIN ud.department d 
        JOIN ud.user u 
        WHERE u.uid = :uid
    """)
    List<String> findDepartmentsByUserUid(String uid);
}
