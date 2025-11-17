package com.htc.productdevelopment.dto;

import com.htc.productdevelopment.model.Department;

public class CreateUserRequest {
    public String email;
    public String password;
    public String name;
    public String role;
    public Department department;  // allow { id: 1 }
}
