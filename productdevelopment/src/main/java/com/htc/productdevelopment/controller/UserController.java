package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.model.Department;
import com.htc.productdevelopment.service.UserService;
import com.htc.productdevelopment.service.OrganizationService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;
    private final OrganizationService organizationService;

    @Autowired
    public UserController(UserService userService, OrganizationService organizationService) {
        this.userService = userService;
        this.organizationService = organizationService;
    }

    // ----------------------------------------------------
    // GET ALL USERS
    // ----------------------------------------------------
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        logger.info("Fetching all users");
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // ----------------------------------------------------
    // GET USER BY ID
    // ----------------------------------------------------
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        logger.info("Fetching user by ID: {}", id);
        Optional<User> user = userService.getUserById(id);
        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // ----------------------------------------------------
    // CREATE USER (SUPPORTS DEPARTMENT)
    // ----------------------------------------------------
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User userData) {
        try {
            logger.info("Create user request: {}", userData);

            // For now, we'll create a user with a default password and REQUESTER role
            // In a real implementation, you might want to handle this differently
            String email = userData.getEmail();
            String name = userData.getName();
            User.Role role = userData.getRole() != null ? userData.getRole() : User.Role.REQUESTER;
            
            // Create user in Firebase and sync to database
            User created = userService.createUserWithRole(
                email, 
                "defaultPassword123", // Default password - should be changed by user
                name, 
                role
            );

            return ResponseEntity.ok(created);
        } catch (Exception e) {
            logger.error("Error creating user", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ----------------------------------------------------
    // UPDATE USER
    // ----------------------------------------------------
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User userData) {
        try {
            logger.info("Update user request for ID {}: {}", id, userData);
            User updated = userService.updateUserById(id, userData);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.error("Error updating user with ID " + id, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ----------------------------------------------------
    // DELETE USER
    // ----------------------------------------------------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            logger.info("Delete user request for ID: {}", id);
            userService.deleteUserById(id);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (Exception e) {
            logger.error("Error deleting user with ID " + id, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ----------------------------------------------------
    // GET ALL DEPARTMENTS
    // ----------------------------------------------------
    @GetMapping("/departments")
    public ResponseEntity<?> getAllDepartments() {
        try {
            List<Department> departments = userService.getAllDepartments();
            return ResponseEntity.ok(departments);
        } catch (Exception e) {
            logger.error("Error fetching departments", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ----------------------------------------------------
    // GET DEPARTMENT BY ID
    // ----------------------------------------------------
    @GetMapping("/departments/{id}")
    public ResponseEntity<?> getDepartmentById(@PathVariable Long id) {
        try {
            // This would need to be implemented in UserService or a DepartmentService
            // For now, returning not found
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error fetching department with ID: " + id, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}