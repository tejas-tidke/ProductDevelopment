package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.dto.CreateUserRequest;
import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.model.Department;
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

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.FirebaseAuthException;

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
     * Complete invitation with Firebase Email-Link authentication
     * @param authorizationHeader Firebase ID token in Authorization header
     * @param requestBody Request body containing invitation token
     * @return The created user
     */
    @PostMapping("/complete-invitation")
    public ResponseEntity<?> completeInvitation(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody Map<String, String> requestBody) {
        logger.info("Received request to complete invitation with Firebase Email-Link authentication");
        
        try {
            // Extract Firebase ID token from Authorization header
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                logger.warn("Invalid Authorization header");
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Invalid Authorization header. Bearer token is required.");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            String idToken = authorizationHeader.substring(7); // Remove "Bearer " prefix
            
            // Verify Firebase ID token
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String firebaseEmail = decodedToken.getEmail();
            String firebaseName = decodedToken.getName() != null ? decodedToken.getName() : "";
            String firebaseUid = decodedToken.getUid();
            
            // Extract invitation token from request body
            String invitationToken = requestBody.get("token");
            if (invitationToken == null || invitationToken.isEmpty()) {
                logger.warn("Invitation token is required");
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Invitation token is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Complete invitation using invitation service
            User user = invitationService.completeInvitation(invitationToken, firebaseEmail, firebaseName);
            
            // Set Firebase UID for the user
            user.setUid(firebaseUid);
            user = userService.updateUserById(user.getId(), user);
            
            logger.info("Invitation completed successfully for user: {}", firebaseEmail);
            return ResponseEntity.ok(user);
        } catch (FirebaseAuthException e) {
            logger.error("Firebase authentication error: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Firebase authentication failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            logger.error("Error completing invitation: {}", e.getMessage(), e);
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
                
                // Create a simplified user object for serialization
                Map<String, Object> userData = new HashMap<>();
                userData.put("id", user.getId());
                userData.put("uid", user.getUid());
                userData.put("email", user.getEmail());
                userData.put("name", user.getName());
                userData.put("avatar", user.getAvatar());
                userData.put("active", user.getActive());
                userData.put("createdAt", user.getCreatedAt());
                userData.put("updatedAt", user.getUpdatedAt());
                userData.put("role", user.getRole().name());
                
                // Include department if present
                if (user.getDepartment() != null) {
                    Map<String, Object> deptData = new HashMap<>();
                    deptData.put("id", user.getDepartment().getId());
                    deptData.put("name", user.getDepartment().getName());
                    userData.put("department", deptData);
                    responseData.put("department", deptData);
                }
                
                // Include organization if present
                if (user.getOrganization() != null) {
                    Map<String, Object> orgData = new HashMap<>();
                    orgData.put("id", user.getOrganization().getId());
                    orgData.put("name", user.getOrganization().getName());
                    userData.put("organization", orgData);
                    responseData.put("organization", orgData);
                }
                
                responseData.put("user", userData);
                
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
            errorResponse.put("error", "Runtime Exception: " + e.getMessage());
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
     * Check if user exists in Firebase or database by email
     * @param email User email
     * @return Existence status
     */
    @GetMapping("/check-user-exists")
    public ResponseEntity<?> checkUserExists(@RequestParam String email) {
        logger.info("Received request to check if user exists with email: {}", email);
        
        try {
            // Validate email parameter
            if (email == null || email.isEmpty()) {
                logger.warn("Check user exists failed: Email is required");
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Email is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Basic email format validation
            if (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
                logger.warn("Check user exists failed: Invalid email format for email: {}", email);
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Invalid email format");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Check if user exists in Firebase
            boolean existsInFirebase = firebaseSyncService.doesUserExistInFirebase(email);
            
            // Check if user exists in database
            boolean existsInDatabase = firebaseSyncService.doesUserExistInDatabase(email);
            
            // Check if email domain is likely valid
            boolean isDomainLikelyValid = true; // For now, we'll assume it's valid
            
            Map<String, Object> response = new HashMap<>();
            response.put("existsInFirebase", existsInFirebase);
            response.put("existsInDatabase", existsInDatabase);
            response.put("isDomainLikelyValid", isDomainLikelyValid);
            response.put("email", email);
            
            logger.info("User existence check completed for email: {}. Exists in Firebase: {}, Exists in Database: {}, Domain Likely Valid: {}", 
                       email, existsInFirebase, existsInDatabase, isDomainLikelyValid);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error checking if user exists with email: {}", email, e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Runtime Exception: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Auto-sync user data between Firebase and database
     * @param uid User ID
     * @return Sync result
     */
    @PostMapping("/auto-sync")
    public ResponseEntity<?> autoSyncUser(@RequestParam String uid) {
        logger.info("Received request to auto-sync user with UID: {}", uid);
        
        try {
            // Validate UID parameter
            if (uid == null || uid.isEmpty()) {
                logger.warn("Auto-sync failed: UID is required");
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "UID is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // Get user from database by UID
            Optional<User> userOpt = userService.getUserByUid(uid);
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                
                // Check if user exists in Firebase
                boolean existsInFirebase = firebaseSyncService.doesUserExistInFirebase(user.getEmail());
                
                if (!existsInFirebase) {
                    logger.warn("User with UID {} does not exist in Firebase", uid);
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("error", "User does not exist in Firebase");
                    return ResponseEntity.badRequest().body(errorResponse);
                }
                
                // Return user data
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("message", "User synced successfully");
                responseData.put("user", user);
                
                logger.info("User auto-sync completed successfully for UID: {}", uid);
                return ResponseEntity.ok(responseData);
            } else {
                // If user doesn't exist in database, create them with default role
                logger.info("User with UID {} not found in database, creating new user with default role", uid);
                try {
                    // Get Firebase user details
                    com.google.firebase.auth.UserRecord firebaseUser = com.google.firebase.auth.FirebaseAuth.getInstance().getUser(uid);
                    
                    // Create user in database with default role
                    User newUser = userService.createUser(uid, firebaseUser.getEmail(), firebaseUser.getDisplayName());
                    
                    Map<String, Object> responseData = new HashMap<>();
                    responseData.put("message", "User created and synced successfully");
                    responseData.put("user", newUser);
                    
                    logger.info("User created and synced successfully for UID: {}", uid);
                    return ResponseEntity.ok(responseData);
                } catch (Exception createException) {
                    logger.error("Error creating user with UID: {}", uid, createException);
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Failed to create user: " + createException.getMessage());
                    return ResponseEntity.badRequest().body(errorResponse);
                }
            }
        } catch (Exception e) {
            logger.error("Error auto-syncing user with UID: {}", uid, e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Runtime Exception: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}