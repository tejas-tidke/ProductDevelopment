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

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    private final UserService userService;
    private final FirebaseSyncService firebaseSyncService;
    private final UserRepository userRepository;
    
    public AuthController(UserService userService, FirebaseSyncService firebaseSyncService, UserRepository userRepository) {
        this.userService = userService;
        this.firebaseSyncService = firebaseSyncService;
        this.userRepository = userRepository;
    }
    
    @PostMapping("/create-user")
    public ResponseEntity<?> createFirebaseUser(@RequestBody Map<String, String> userData) {
        logger.info("Create Firebase user endpoint called");
        
        try {
            String email = userData.get("email");
            String password = userData.get("password");
            String name = userData.get("name");
            String roleStr = userData.get("role");
            
            logger.debug("Create user data - Email: {}, Name: {}, Role: {}", email, name, roleStr);
            
            if (email == null || email.isEmpty() || password == null || password.isEmpty()) {
                logger.warn("User creation failed: Email and password are required");
                return ResponseEntity.badRequest().body("Email and password are required");
            }
            
            User.Role role = User.Role.USER; // Default role
            if (roleStr != null && !roleStr.isEmpty()) {
                try {
                    role = User.Role.valueOf(roleStr.toUpperCase());
                } catch (IllegalArgumentException e) {
                    logger.warn("Invalid role value: {}, using default USER role", roleStr);
                }
            }
            
            User user = firebaseSyncService.createFirebaseUser(email, password, name, role);
            logger.info("Firebase user created and synced successfully: {}", user.getUid());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error creating Firebase user: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error creating user: " + e.getMessage());
        }
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> userData) {
        logger.info("Register user endpoint called");
        
        try {
            String uid = userData.get("uid");
            String email = userData.get("email");
            String name = userData.get("name");
            
            logger.debug("Registration data - UID: {}, Email: {}, Name: {}", uid, email, name);
            
            if (uid == null || uid.isEmpty()) {
                logger.warn("Registration failed: UID is required");
                return ResponseEntity.badRequest().body("UID is required");
            }
            
            User user = userService.createUser(uid, email, name);
            logger.info("User registered successfully: {}", uid);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error registering user: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/sync-firebase-user")
    public ResponseEntity<?> syncFirebaseUser(@RequestBody Map<String, String> requestData) {
        logger.info("Sync Firebase user endpoint called");
        
        try {
            String uid = requestData.get("uid");
            String email = requestData.get("email");
            String name = requestData.get("name");
            
            logger.debug("Sync request data - UID: {}, Email: {}, Name: {}", uid, email, name);
            
            if (uid == null || uid.isEmpty()) {
                logger.warn("Sync failed: UID is required");
                return ResponseEntity.badRequest().body("UID is required");
            }
            
            // Log the request data for debugging
            logger.info("Received sync request for Firebase user: {}", uid);
            
            User user = firebaseSyncService.syncFirebaseUserToDB(uid);
            logger.info("Firebase user synced successfully: {}", uid);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error syncing Firebase user: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error syncing user: " + e.getMessage());
        }
    }
    
    @PostMapping("/sync-firebase-user-token")
    public ResponseEntity<?> syncFirebaseUserByToken(@RequestBody Map<String, String> requestData) {
        logger.info("Sync Firebase user by token endpoint called");
        
        try {
            String idToken = requestData.get("idToken");
            logger.debug("Sync request with ID token: {}", idToken != null ? idToken.substring(0, Math.min(idToken.length(), 20)) + "..." : "null");
            
            if (idToken == null || idToken.isEmpty()) {
                logger.warn("Sync failed: ID token is required");
                return ResponseEntity.badRequest().body("ID token is required");
            }
            
            User user = firebaseSyncService.syncFirebaseUserByToken(idToken);
            logger.info("Firebase user synced by token successfully: {}", user.getUid());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error syncing Firebase user by token: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error syncing user: " + e.getMessage());
        }
    }
    
    @GetMapping("/role/{uid}")
    public ResponseEntity<?> getUserRole(@PathVariable String uid) {
        logger.info("Get user role endpoint called for UID: {}", uid);
        
        Optional<User> user = userService.getUserByUid(uid);
        if (user.isPresent()) {
            logger.debug("User found, role: {}, avatar: {}", user.get().getRole(), user.get().getAvatar());
            Map<String, Object> response = new HashMap<>();
            response.put("role", user.get().getRole());
            response.put("user", user.get());
            return ResponseEntity.ok(response);
        } else {
            logger.warn("User not found: {}", uid);
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/isAdmin/{uid}")
    public ResponseEntity<?> isAdmin(@PathVariable String uid) {
        logger.info("Check if user is admin endpoint called for UID: {}", uid);
        
        boolean isAdmin = userService.isAdmin(uid);
        logger.debug("User isAdmin: {}", isAdmin);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isAdmin", isAdmin);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/isUser/{uid}")
    public ResponseEntity<?> isUser(@PathVariable String uid) {
        logger.info("Check if user is regular user endpoint called for UID: {}", uid);
        
        boolean isUser = userService.isUser(uid);
        logger.debug("User isUser: {}", isUser);
        Map<String, Boolean> response = new HashMap<>();
        response.put("isUser", isUser);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/users/role/{role}")
    public ResponseEntity<?> getUsersByRole(@PathVariable String role) {
        logger.info("Get users by role endpoint called for role: {}", role);
        
        try {
            User.Role userRole = User.Role.valueOf(role.toUpperCase());
            List<User> users = userService.getUsersByRole(userRole);
            logger.debug("Found {} users with role: {}", users.size(), role);
            return ResponseEntity.ok(users);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid role value: {}", role);
            return ResponseEntity.badRequest().body("Invalid role value");
        }
    }
    
    @GetMapping("/users/active")
    public ResponseEntity<?> getActiveUsers() {
        logger.info("Get active users endpoint called");
        
        List<User> users = userService.getUsersByActiveStatus(true);
        logger.debug("Found {} active users", users.size());
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/users/inactive")
    public ResponseEntity<?> getInactiveUsers() {
        logger.info("Get inactive users endpoint called");
        
        List<User> users = userService.getUsersByActiveStatus(false);
        logger.debug("Found {} inactive users", users.size());
        return ResponseEntity.ok(users);
    }
    
    @PutMapping("/role/{uid}")
    public ResponseEntity<?> updateUserRole(@PathVariable String uid, @RequestBody Map<String, String> roleData) {
        logger.info("Update user role endpoint called for UID: {}", uid);
        
        try {
            String roleStr = roleData.get("role");
            logger.debug("Role update request - UID: {}, Role: {}", uid, roleStr);
            
            if (roleStr == null || roleStr.isEmpty()) {
                logger.warn("Role update failed: Role is required");
                return ResponseEntity.badRequest().body("Role is required");
            }
            
            User.Role role = User.Role.valueOf(roleStr.toUpperCase());
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
    
    @PutMapping("/avatar/{uid}")
    public ResponseEntity<?> updateUserAvatar(@PathVariable String uid, @RequestBody Map<String, String> avatarData) {
        logger.info("Update user avatar endpoint called for UID: {}", uid);
        
        try {
            String avatar = avatarData.get("avatar");
            logger.debug("Avatar update request - UID: {}, Avatar length: {}", uid, avatar != null ? avatar.length() : 0);
            
            if (avatar == null) {
                logger.warn("Avatar update failed: Avatar is null");
                return ResponseEntity.badRequest().body("Avatar is required");
            }
            
            // Log first 100 characters of avatar for debugging
            if (!avatar.isEmpty()) {
                logger.debug("Avatar data preview: {}", avatar.substring(0, Math.min(avatar.length(), 100)) + "...");
            }
            
            User user = userService.updateUserAvatar(uid, avatar);
            logger.info("User avatar updated: {} to {}", uid, avatar.substring(0, Math.min(avatar.length(), 50)) + "...");
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error updating user avatar: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // Utility endpoint to check database status
    @GetMapping("/db-status")
    public ResponseEntity<?> getDatabaseStatus() {
        logger.info("Database status check endpoint called");
        
        try {
            List<User> users = firebaseSyncService.getAllUsers();
            long adminCount = userService.countUsersByRole(User.Role.ADMIN);
            long userCount = userService.countUsersByRole(User.Role.USER);
            long activeCount = userService.countUsersByActiveStatus(true);
            long inactiveCount = userService.countUsersByActiveStatus(false);
            
            logger.debug("Database query successful, found {} users", users.size());
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Connected");
            response.put("totalUserCount", users.size());
            response.put("adminCount", adminCount);
            response.put("userCount", userCount);
            response.put("activeCount", activeCount);
            response.put("inactiveCount", inactiveCount);
            response.put("users", users);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Database connection error: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // Diagnostic endpoint to test Firebase connectivity
    @PostMapping("/test-firebase-connection")
    public ResponseEntity<?> testFirebaseConnection(@RequestBody Map<String, String> requestData) {
        logger.info("Firebase connection test endpoint called");
        
        try {
            String uid = requestData.get("uid");
            if (uid == null || uid.isEmpty()) {
                return ResponseEntity.badRequest().body("UID is required for testing");
            }
            
            logger.debug("Testing Firebase connection for UID: {}", uid);
            
            // Test Firebase connection
            com.google.firebase.auth.UserRecord firebaseUser = 
                com.google.firebase.auth.FirebaseAuth.getInstance().getUserAsync(uid).get();
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Firebase connection successful");
            response.put("firebaseUser", Map.of(
                "uid", firebaseUser.getUid(),
                "email", firebaseUser.getEmail(),
                "displayName", firebaseUser.getDisplayName()
            ));
            
            logger.info("Firebase connection test successful for UID: {}", uid);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Firebase connection test failed: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Firebase connection failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // Diagnostic endpoint to check database connection
    @GetMapping("/test-db-connection")
    public ResponseEntity<?> testDatabaseConnection() {
        logger.info("Database connection test endpoint called");
        
        try {
            boolean isConnected = firebaseSyncService.checkDatabaseConnection();
            long userCount = userRepository.count();
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", isConnected ? "Database connection successful" : "Database connection failed");
            response.put("isConnected", isConnected);
            response.put("userCount", userCount);
            
            logger.info("Database connection test result: {} ({} users)", 
                isConnected ? "SUCCESS" : "FAILED", userCount);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Database connection test failed: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Database connection test failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // Manual sync endpoint for testing
    @PostMapping("/manual-sync-test")
    public ResponseEntity<?> manualSyncTest(@RequestBody Map<String, String> requestData) {
        logger.info("Manual sync test endpoint called");
        
        try {
            String uid = requestData.get("uid");
            if (uid == null || uid.isEmpty()) {
                logger.warn("Manual sync test failed: UID is required");
                return ResponseEntity.badRequest().body("UID is required");
            }
            
            logger.info("Starting manual sync test for UID: {}", uid);
            
            // Step 1: Check if user exists in database
            boolean existsInDb = userRepository.existsByUid(uid);
            logger.info("User exists in database: {}", existsInDb);
            
            // Step 2: Try to fetch from Firebase
            logger.info("Attempting to fetch user from Firebase");
            com.google.firebase.auth.UserRecord firebaseUser = 
                com.google.firebase.auth.FirebaseAuth.getInstance().getUserAsync(uid).get();
            
            logger.info("Firebase user data - UID: {}, Email: {}, Display Name: {}", 
                firebaseUser.getUid(), firebaseUser.getEmail(), firebaseUser.getDisplayName());
            
            // Step 3: Sync to database
            logger.info("Syncing user to database");
            User user = firebaseSyncService.syncFirebaseUserToDB(uid);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Manual sync successful");
            response.put("existedInDbBeforeSync", existsInDb);
            response.put("firebaseUser", Map.of(
                "uid", firebaseUser.getUid(),
                "email", firebaseUser.getEmail(),
                "displayName", firebaseUser.getDisplayName()
            ));
            response.put("databaseUser", user);
            
            logger.info("Manual sync test completed successfully for UID: {}", uid);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Manual sync test failed: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Manual sync failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // Schema validation endpoint
    @PostMapping("/validate-schema")
    public ResponseEntity<?> validateSchema() {
        logger.info("Schema validation endpoint called");
        
        try {
            firebaseSyncService.validateSchema();
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Schema validation completed");
            logger.info("Schema validation completed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Schema validation failed: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Schema validation failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // Endpoint to sync all Firebase users to database
    @PostMapping("/sync-all-firebase-users")
    public ResponseEntity<?> syncAllFirebaseUsers() {
        logger.info("Sync all Firebase users endpoint called");
        
        try {
            List<User> syncedUsers = firebaseSyncService.syncAllFirebaseUsers();
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Successfully synced all Firebase users");
            response.put("syncedUserCount", syncedUsers.size());
            response.put("syncedUsers", syncedUsers);
            
            logger.info("Successfully synced {} Firebase users to database", syncedUsers.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error syncing all Firebase users: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Error syncing Firebase users");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}