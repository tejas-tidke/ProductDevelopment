package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.model.Department;
import com.htc.productdevelopment.service.UserService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
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

            // userData contains department -> { id: X }
            User created = userService.createUserFromData(userData);

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
            userService.deleteUserById(id);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (Exception e) {
            logger.error("Error deleting user", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
