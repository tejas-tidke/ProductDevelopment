package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.model.Department;
import com.htc.productdevelopment.repository.DepartmentRepository;
import com.htc.productdevelopment.service.UserService;
import com.htc.productdevelopment.service.FirebaseSyncService;
import com.htc.productdevelopment.service.InvitationService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;
    private final FirebaseSyncService firebaseSyncService;
    private final InvitationService invitationService;
    
    @Autowired
    private DepartmentRepository departmentRepository;

    public UserController(UserService userService, FirebaseSyncService firebaseSyncService, InvitationService invitationService) {
        this.userService = userService;
        this.firebaseSyncService = firebaseSyncService;
        this.invitationService = invitationService;
    }

    // ----------------------------------------------------
    // GET ALL USERS
    // ----------------------------------------------------
    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Error fetching users", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ----------------------------------------------------
    // GET ALL DEPARTMENTS
    // ----------------------------------------------------
    @GetMapping("/departments")
    public ResponseEntity<?> getAllDepartments() {
        try {
            logger.info("Fetching all departments");
            List<Department> departments = departmentRepository.findAll();
            logger.info("Fetched {} departments", departments.size());
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
            logger.info("Fetching department with id: {}", id);
            return departmentRepository.findById(id)
                    .map(department -> ResponseEntity.ok(department))
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error fetching department", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ----------------------------------------------------
    // GET USER BY ID
    // ----------------------------------------------------
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            Optional<User> user = userService.getUserById(id);
            return user.map(ResponseEntity::ok)
                       .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error fetching user", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
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
            User created = firebaseSyncService.createFirebaseUser(
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
    // UPDATE USER (SUPPORTS DEPARTMENT)
    // ----------------------------------------------------
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User userData) {
        try {
            logger.info("Update user request for ID {}: {}", id, userData);

            User updated = userService.updateUserById(id, userData);

            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.error("Error updating user", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ----------------------------------------------------
    // DELETE USER
    // ----------------------------------------------------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            String userEmail = null;
            // First, get the user to get their UID and email
            Optional<User> userOptional = userService.getUserById(id);
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                userEmail = user.getEmail();
                
                // Delete user from Firebase first
                try {
                    firebaseSyncService.deleteFirebaseUser(user.getUid());
                    logger.info("Firebase user deleted successfully: {}", user.getUid());
                } catch (Exception e) {
                    logger.warn("Failed to delete user from Firebase: {}", e.getMessage(), e);
                    // Continue with database deletion even if Firebase deletion fails
                }
            } else {
                // If user not found in database, still try to delete from Firebase if UID was provided in some way
                logger.warn("User not found in database with ID: {}", id);
            }
            
            // Delete user from database
            userService.deleteUserById(id);
            
            // Also delete any pending invitations for this user's email
            if (userEmail != null) {
                try {
                    invitationService.deletePendingInvitationsByEmail(userEmail);
                    logger.info("Pending invitations deleted for email: {}", userEmail);
                } catch (Exception e) {
                    logger.warn("Failed to delete pending invitations for email: {}", userEmail, e);
                }
            }
            
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (Exception e) {
            logger.error("Error deleting user", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}