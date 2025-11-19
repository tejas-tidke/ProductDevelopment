package com.htc.productdevelopment.dto;

import com.htc.productdevelopment.model.Department;

public class CreateUserRequest {
    public String email;
    public String password;
    public String name;
    public String role;
    public Department department;
    
    // Default constructor
    public CreateUserRequest() {}
    
    // Constructor with all fields
    public CreateUserRequest(String email, String password, String name, String role, Department department) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.role = role;
        this.department = department;
    }
    
    // Getters and setters
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
    public Department getDepartment() {
        return department;
    }
    
    public void setDepartment(Department department) {
        this.department = department;
    }
}