package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.repository.UserRepository;
import com.htc.productdevelopment.service.UserService;
import com.htc.productdevelopment.service.FirebaseSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Controller class for handling authentication-related API requests
 * This controller manages user authentication, registration, and role management
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    // Logger for tracking controller operations
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    // Services for handling user and Firebase operations
    private final UserService userService;
    private final FirebaseSyncService firebaseSyncService;
    private final UserRepository userRepository;
    
    /**
     * Constructor to initialize dependencies
     * @param userService Service for user operations
     * @param firebaseSyncService Service for Firebase synchronization
     * @param userRepository Repository for database operations
     */
    public AuthController(UserService userService, FirebaseSyncService firebaseSyncService, UserRepository userRepository) {
        this.userService = userService;
        this.firebaseSyncService = firebaseSyncService;
        this.userRepository = userRepository;
    }
    
    /**
     * Create a new Firebase user and sync to local database
     * @param userData User data including email, password, name, and role
     * @return The created user
     */
    @PostMapping("/create-user")
    public ResponseEntity<?> createFirebaseUser(@RequestBody Map<String, String> userData) {
        logger.info("Received request to create Firebase user");
        
        try {
            // Extract user data from request
            String email = userData.get("email");
            String password = userData.get("password");
            String name = userData.get("name");
            String roleStr = userData.get("role");
            
            // Validate required fields
            if (email == null || email.isEmpty() || password == null || password.isEmpty()) {
                logger.warn("User creation failed: Email and password are required");
                return ResponseEntity.badRequest().body("Email and password are required");
            }
            
            // Set default role to USER if not provided
            User.Role role = User.Role.USER;
            if (roleStr != null && !roleStr.isEmpty()) {
                try {
                    role = User.Role.valueOf(roleStr.toUpperCase());
                } catch (IllegalArgumentException e) {
                    logger.warn("Invalid role value: {}, using default USER role", roleStr);
                }
            }
            
            // Create user in Firebase and sync to database
            User user = firebaseSyncService.createFirebaseUser(email, password, name, role);
            logger.info("Firebase user created and synced successfully: {}", user.getUid());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error creating Firebase user: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error creating user: " + e.getMessage());
        }
    }
    
    /**
     * Register a new user in the local database
     * @param userData User data including UID, email, and name
     * @return The registered user
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> userData) {
        logger.info("Received request to register user");
        
        try {
            // Extract user data from request
            String uid = userData.get("uid");
            String email = userData.get("email");
            String name = userData.get("name");
            
            // Validate required field
            if (uid == null || uid.isEmpty()) {
                logger.warn("Registration failed: UID is required");
                return ResponseEntity.badRequest().body("UID is required");
            }
            
            // Create user in database
            User user = userService.createUser(uid, email, name);
            logger.info("User registered successfully: {}", uid);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error registering user: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Sync Firebase user data to local database
     * @param requestData Request data containing UID
     * @return The synced user
     */
    @PostMapping("/sync-firebase-user")
    public ResponseEntity<?> syncFirebaseUser(@RequestBody Map<String, String> requestData) {
        logger.info("Received request to sync Firebase user");
        
        try {
            // Extract UID from request
            String uid = requestData.get("uid");
            
            // Validate required field
            if (uid == null || uid.isEmpty()) {
                logger.warn("Sync failed: UID is required");
                return ResponseEntity.badRequest().body("UID is required");
            }
            
            // Sync user from Firebase to database
            User user = firebaseSyncService.syncFirebaseUserToDB(uid);
            logger.info("Firebase user synced successfully: {}", uid);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error syncing Firebase user: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error syncing user: " + e.getMessage());
        }
    }
    
    /**
     * Sync Firebase user by token
     * @param requestData Request data containing ID token
     * @return The synced user
     */
    @PostMapping("/sync-firebase-user-token")
    public ResponseEntity<?> syncFirebaseUserByToken(@RequestBody Map<String, String> requestData) {
        logger.info("Received request to sync Firebase user by token");
        
        try {
            // Extract ID token from request
            String idToken = requestData.get("idToken");
            
            // Validate required field
            if (idToken == null || idToken.isEmpty()) {
                logger.warn("Sync failed: ID token is required");
                return ResponseEntity.badRequest().body("ID token is required");
            }
            
            // Sync user from Firebase to database using token
            User user = firebaseSyncService.syncFirebaseUserByToken(idToken);
            logger.info("Firebase user synced by token successfully: {}", user.getUid());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error syncing Firebase user by token: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error syncing user: " + e.getMessage());
        }
    }
    
    /**
     * Get user role by UID
     * @param uid User ID
     * @return User role
     */
    @GetMapping("/role/{uid}")
    public ResponseEntity<?> getUserRole(@PathVariable String uid) {
        logger.info("Received request for user role: {}", uid);
        
        // Get user from database
        Optional<User> user = userService.getUserByUid(uid);
        if (user.isPresent()) {
            // Return user role and user data
            Map<String, Object> response = new HashMap<>();
            response.put("role", user.get().getRole());
            response.put("user", user.get());
            logger.info("Returning role for user: {}", uid);
            return ResponseEntity.ok(response);
        } else {
            logger.warn("User not found: {}", uid);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Check if user is admin
     * @param uid User ID
     * @return Whether user is admin
     */
    @GetMapping("/isAdmin/{uid}")
    public ResponseEntity<?> isAdmin(@PathVariable String uid) {
        logger.info("Received request to check if user is admin: {}", uid);
        
        // Check if user is admin
        boolean isAdmin = userService.isAdmin(uid);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isAdmin", isAdmin);
        logger.info("User {} isAdmin: {}", uid, isAdmin);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Check if user is regular user
     * @param uid User ID
     * @return Whether user is regular user
     */
    @GetMapping("/isUser/{uid}")
    public ResponseEntity<?> isUser(@PathVariable String uid) {
        logger.info("Received request to check if user is regular user: {}", uid);
        
        // Check if user is regular user
        boolean isUser = userService.isUser(uid);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isUser", isUser);
        logger.info("User {} isUser: {}", uid, isUser);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get users by role
     * @param role User role
     * @return List of users with specified role
     */
    @GetMapping("/users/role/{role}")
    public ResponseEntity<?> getUsersByRole(@PathVariable String role) {
        logger.info("Received request for users with role: {}", role);
        
        try {
            // Convert role string to enum
            User.Role userRole = User.Role.valueOf(role.toUpperCase());
            
            // Get users with specified role
            List<User> users = userService.getUsersByRole(userRole);
            logger.info("Returning {} users with role: {}", users.size(), role);
            return ResponseEntity.ok(users);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid role value: {}", role);
            return ResponseEntity.badRequest().body("Invalid role value");
        }
    }
    
    /**
     * Get active users
     * @return List of active users
     */
    @GetMapping("/users/active")
    public ResponseEntity<?> getActiveUsers() {
        logger.info("Received request for active users");
        
        // Get active users
        List<User> users = userService.getUsersByActiveStatus(true);
        logger.info("Returning {} active users", users.size());
        return ResponseEntity.ok(users);
    }
    
    /**
     * Get inactive users
     * @return List of inactive users
     */
    @GetMapping("/users/inactive")
    public ResponseEntity<?> getInactiveUsers() {
        logger.info("Received request for inactive users");
        
        // Get inactive users
        List<User> users = userService.getUsersByActiveStatus(false);
        logger.info("Returning {} inactive users", users.size());
        return ResponseEntity.ok(users);
    }
    
    /**
     * Update user role
     * @param uid User ID
     * @param roleData Role data containing new role
     * @return Updated user
     */
    @PutMapping("/role/{uid}")
    public ResponseEntity<?> updateUserRole(@PathVariable String uid, @RequestBody Map<String, String> roleData) {
        logger.info("Received request to update user role: {}", uid);
        
        try {
            // Extract role from request
            String roleStr = roleData.get("role");
            
            // Validate required field
            if (roleStr == null || roleStr.isEmpty()) {
                logger.warn("Role update failed: Role is required");
                return ResponseEntity.badRequest().body("Role is required");
            }
            
            // Convert role string to enum
            User.Role role = User.Role.valueOf(roleStr.toUpperCase());
            
            // Update user role
            User user = userService.updateUserRole(uid, role);
            logger.info("User role updated: {} to {}", uid, role);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid role value: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Invalid role value");
        } catch (Exception e) {
            logger.error("Error updating user role: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Update user avatar
     * @param uid User ID
     * @param avatarData Avatar data containing new avatar
     * @return Updated user
     */
    @PutMapping("/avatar/{uid}")
    public ResponseEntity<?> updateUserAvatar(@PathVariable String uid, @RequestBody Map<String, String> avatarData) {
        logger.info("Received request to update user avatar: {}", uid);
        
        try {
            // Extract avatar from request
            String avatar = avatarData.get("avatar");
            
            // Validate required field
            if (avatar == null) {
                logger.warn("Avatar update failed: Avatar is null");
                return ResponseEntity.badRequest().body("Avatar is required");
            }
            
            // Update user avatar
            User user = userService.updateUserAvatar(uid, avatar);
            logger.info("User avatar updated: {}", uid);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error updating user avatar: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Auto-sync endpoint for login - automatically creates user with default role
     * @param requestData Request data containing UID
     * @return Auto-synced user
     */
    @PostMapping("/auto-sync")
    public ResponseEntity<?> autoSyncUser(@RequestBody Map<String, String> requestData) {
        logger.info("Received request to auto-sync user");
        
        try {
            // Extract UID from request
            String uid = requestData.get("uid");
            
            // Validate required field
            if (uid == null || uid.isEmpty()) {
                logger.warn("Auto-sync failed: UID is required");
                return ResponseEntity.badRequest().body("UID is required");
            }
            
            // Auto-sync user
            User user = firebaseSyncService.autoSyncFirebaseUser(uid);
            logger.info("User auto-synced successfully: {}", uid);
            
            // Return user and role
            Map<String, Object> response = new HashMap<>();
            response.put("user", user);
            response.put("role", user.getRole());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error auto-syncing user: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error auto-syncing user: " + e.getMessage());
        }
    }
}