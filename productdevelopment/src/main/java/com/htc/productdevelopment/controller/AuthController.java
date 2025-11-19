package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.dto.CreateUserRequest;
import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.repository.UserRepository;
import com.htc.productdevelopment.service.UserService;
import com.htc.productdevelopment.service.FirebaseSyncService;
import com.htc.productdevelopment.service.InvitationService;
import com.htc.productdevelopment.service.OrganizationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

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
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {
    
    // Logger for tracking controller operations
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    // Services for handling user and Firebase operations
    private final UserService userService;
    private final FirebaseSyncService firebaseSyncService;
    private final UserRepository userRepository;
    private final InvitationService invitationService;
    private final OrganizationService organizationService;
    
    /**
     * Constructor to initialize dependencies
     * @param userService Service for user operations
     * @param firebaseSyncService Service for Firebase synchronization
     * @param userRepository Repository for database operations
     * @param invitationService Service for invitation operations
     * @param organizationService Service for organization operations
     */
    public AuthController(UserService userService, FirebaseSyncService firebaseSyncService, UserRepository userRepository, InvitationService invitationService, OrganizationService organizationService) {
        this.userService = userService;
        this.firebaseSyncService = firebaseSyncService;
        this.userRepository = userRepository;
        this.invitationService = invitationService;
        this.organizationService = organizationService;
    }
    
    /**
     * Create a new Firebase user and sync to local database
     * @param userData User data including email, password, name, and role
     * @return The created user
     */
    @PostMapping("/create-user")
    public ResponseEntity<?> createFirebaseUser(@RequestBody CreateUserRequest userData)
 {
        logger.info("Received request to create Firebase user");
        
        try {
            // Extract user data from request
        	String email = userData.email;
        	String password = userData.password;
        	String name = userData.name;
        	String roleStr = userData.role;

            
            // Validate required fields
            if (email == null || email.isEmpty() || password == null || password.isEmpty()) {
                logger.warn("User creation failed: Email and password are required");
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Email and password are required");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Set default role to REQUESTER if not provided
            User.Role role = User.Role.REQUESTER;
            if (roleStr != null && !roleStr.isEmpty()) {
                try {
                    role = User.Role.valueOf(roleStr.toUpperCase());
                } catch (IllegalArgumentException e) {
                    logger.warn("Invalid role value: {}, using default REQUESTER role", roleStr);
                }
            }
            
            // Create user in Firebase and sync to database
            User user = firebaseSyncService.createFirebaseUser(email, password, name, role);
            logger.info("Firebase user created and synced successfully: {}", user.getUid());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error creating Firebase user", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
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
            // Extract UID from request data
            String uid = requestData.get("uid");
            String email = requestData.get("email");
            String name = requestData.get("name");
            
            // Validate required field
            if (uid == null || uid.isEmpty()) {
                logger.warn("Sync failed: UID is required");
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "UID is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Sync user data
            User user = firebaseSyncService.syncUser(uid, email, name);
            logger.info("Firebase user synced successfully: {}", uid);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error syncing Firebase user", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Automatically sync user with default role if not already in database
     * @param requestData Request data containing UID
     * @return The synced user
     */
    @PostMapping("/auto-sync")
    public ResponseEntity<?> autoSyncUser(@RequestBody Map<String, String> requestData) {
        logger.info("Received request to auto-sync user");
        
        try {
            // Extract UID from request data
            String uid = requestData.get("uid");
            
            // Validate required field
            if (uid == null || uid.isEmpty()) {
                logger.warn("Auto-sync failed: UID is required");
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "UID is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Auto-sync user
            User user = firebaseSyncService.autoSyncUser(uid);
            logger.info("User auto-synced successfully: {}", uid);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error auto-syncing user", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Get user role by UID
     * @param uid User ID
     * @return User role
     */
    @GetMapping("/role/{uid}")
    public ResponseEntity<?> getUserRole(@PathVariable String uid) {
        logger.info("Received request to get role for user: {}", uid);
        
        try {
            // Get user by UID
            Optional<User> userOpt = userService.getUserByUid(uid);
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("role", user.getRole().name());
                responseData.put("user", user);
                
                // Include department if present
                if (user.getDepartment() != null) {
                    Map<String, Object> deptData = new HashMap<>();
                    deptData.put("id", user.getDepartment().getId());
                    deptData.put("name", user.getDepartment().getName());
                    responseData.put("department", deptData);
                }
                
                // Include organization if present
                if (user.getOrganization() != null) {
                    Map<String, Object> orgData = new HashMap<>();
                    orgData.put("id", user.getOrganization().getId());
                    orgData.put("name", user.getOrganization().getName());
                    responseData.put("organization", orgData);
                }
                
                logger.info("Role retrieved successfully for user: {}", uid);
                return ResponseEntity.ok(responseData);
            } else {
                logger.warn("User not found: {}", uid);
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "User not found");
                return ResponseEntity.badRequest().body(errorResponse);
            }
        } catch (Exception e) {
            logger.error("Error getting role for user: {}", uid, e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Check if user is admin
     * @param uid User ID
     * @return Admin status
     */
    @GetMapping("/isAdmin/{uid}")
    public ResponseEntity<?> isAdmin(@PathVariable String uid) {
        logger.info("Received request to check if user is admin: {}", uid);
        
        try {
            boolean isAdmin = userService.isAdmin(uid);
            logger.info("Admin check completed for user: {}, result: {}", uid, isAdmin);
            return ResponseEntity.ok(Map.of("isAdmin", isAdmin));
        } catch (Exception e) {
            logger.error("Error checking admin status for user: {}", uid, e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Check if user is regular user
     * @param uid User ID
     * @return User status
     */
    @GetMapping("/isUser/{uid}")
    public ResponseEntity<?> isUser(@PathVariable String uid) {
        logger.info("Received request to check if user is regular user: {}", uid);
        
        try {
            boolean isUser = userService.isRequester(uid);
            logger.info("User check completed for user: {}, result: {}", uid, isUser);
            return ResponseEntity.ok(Map.of("isUser", isUser));
        } catch (Exception e) {
            logger.error("Error checking user status for user: {}", uid, e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Update user role
     * @param uid User ID
     * @param roleData Role data
     * @return Updated user
     */
    @PutMapping("/role/{uid}")
    public ResponseEntity<?> updateUserRole(@PathVariable String uid, @RequestBody Map<String, String> roleData) {
        logger.info("Received request to update role for user: {}", uid);
        
        try {
            String roleStr = roleData.get("role");
            
            // Validate required field
            if (roleStr == null || roleStr.isEmpty()) {
                logger.warn("Role update failed: Role is required");
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Role is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Convert role string to enum
            User.Role role = User.Role.valueOf(roleStr.toUpperCase());
            
            // Update user role
            User user = userService.updateUserRole(uid, role);
            logger.info("User role updated: {} to {}", uid, role);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid role value: {}", e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid role value");
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("Error updating user role: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Get database status
     * @return Database status
     */
    @GetMapping("/db-status")
    public ResponseEntity<?> getDatabaseStatus() {
        logger.info("Received request to get database status");
        
        try {
            long userCount = userRepository.count();
            Map<String, Object> status = new HashMap<>();
            status.put("userCount", userCount);
            status.put("status", "OK");
            logger.info("Database status retrieved successfully");
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            logger.error("Error getting database status", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Update user avatar
     * @param uid User ID
     * @param avatarData Avatar data
     * @return Updated user
     */
    @PutMapping("/avatar/{uid}")
    public ResponseEntity<?> updateUserAvatar(@PathVariable String uid, @RequestBody Map<String, String> avatarData) {
        logger.info("Received request to update avatar for user: {}", uid);
        
        try {
            String avatar = avatarData.get("avatar");
            
            // Update user avatar
            User user = userService.updateUserAvatar(uid, avatar);
            logger.info("User avatar updated: {}", uid);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error updating user avatar: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Register a new user (for OAuth flow)
     * @param userData User data
     * @return Registered user
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
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "UID is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Create user in database
            User user = userService.saveUserToDB(uid, email, name, User.Role.REQUESTER);
            logger.info("User registered successfully: {}", uid);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error registering user: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Disable a user by setting their active status to false
     * @param uid User ID
     * @return Updated user
     */
    @PutMapping("/users/{uid}/disable")
    public ResponseEntity<?> disableUser(@PathVariable String uid) {
        logger.info("Received request to disable user: {}", uid);
        
        try {
            // Disable user
            User user = userService.disableUser(uid);
            logger.info("User disabled successfully: {}", uid);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error disabling user: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error disabling user: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Enable a user by setting their active status to true
     * @param uid User ID
     * @return Updated user
     */
    @PutMapping("/users/{uid}/enable")
    public ResponseEntity<?> enableUser(@PathVariable String uid) {
        logger.info("Received request to enable user: {}", uid);
        
        try {
            // Enable user
            User user = userService.enableUser(uid);
            logger.info("User enabled successfully: {}", uid);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error enabling user: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error enabling user: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Delete a user by UID
     * @param uid User ID
     * @return Success message
     */
    @DeleteMapping("/users/{uid}")
    public ResponseEntity<?> deleteUser(@PathVariable String uid) {
        logger.info("Received request to delete user: {}", uid);
        
        try {
            // Delete user
            userService.deleteUser(uid);
            logger.info("User deleted successfully: {}", uid);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (Exception e) {
            logger.error("Error deleting user: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error deleting user: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Sync all Firebase users to local database
     * @return Sync result
     */
    @PostMapping("/sync-all-firebase-users")
    public ResponseEntity<?> syncAllFirebaseUsers() {
        logger.info("Received request to sync all Firebase users");
        
        try {
            // Sync all users
            List<User> users = firebaseSyncService.syncAllUsers();
            logger.info("All Firebase users synced successfully, count: {}", users.size());
            return ResponseEntity.ok(Map.of("message", "Synced " + users.size() + " users", "users", users));
        } catch (Exception e) {
            logger.error("Error syncing all Firebase users", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error syncing users: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}