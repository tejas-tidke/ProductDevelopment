package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Controller class for handling user management API requests
 * This controller manages user listing, retrieval, and general user operations
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {
    
    // Logger for tracking controller operations
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    
    // Service for handling user operations
    private final UserService userService;
    
    /**
     * Constructor to initialize dependencies
     * @param userService Service for user operations
     */
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    /**
     * Get all users
     * @return List of all users
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        logger.info("Received request for all users");
        
        try {
            // Get all users
            List<User> users = userService.getAllUsers();
            logger.info("Returning {} users", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Error fetching all users: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error fetching users: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Get user by ID
     * @param id User ID
     * @return User with specified ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        logger.info("Received request for user by ID: {}", id);
        
        try {
            // Get user by ID
            Optional<User> user = userService.getUserById(id);
            if (user.isPresent()) {
                logger.info("Returning user: {}", id);
                return ResponseEntity.ok(user.get());
            } else {
                logger.warn("User not found: {}", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error fetching user: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error fetching user: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Create a new user
     * @param userData User data
     * @return Created user
     */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User userData) {
        logger.info("Received request to create user");
        
        try {
            // Create user
            User user = userService.createUserFromData(userData);
            logger.info("User created successfully: {}", user.getId());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error creating user: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error creating user: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Update user
     * @param id User ID
     * @param userData User data
     * @return Updated user
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User userData) {
        logger.info("Received request to update user: {}", id);
        
        try {
            // Update user
            User user = userService.updateUserById(id, userData);
            logger.info("User updated successfully: {}", id);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error updating user: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error updating user: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Delete user
     * @param id User ID
     * @return Success message
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        logger.info("Received request to delete user: {}", id);
        
        try {
            // Delete user
            userService.deleteUserById(id);
            logger.info("User deleted successfully: {}", id);
            Map<String, String> successResponse = new HashMap<>();
            successResponse.put("message", "User deleted successfully");
            return ResponseEntity.ok(successResponse);
        } catch (Exception e) {
            logger.error("Error deleting user: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error deleting user: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}