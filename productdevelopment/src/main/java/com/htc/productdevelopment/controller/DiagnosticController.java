package com.htc.productdevelopment.controller;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.ListUsersPage;
import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.repository.UserRepository;
import com.htc.productdevelopment.service.FirebaseSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/diagnostic")
public class DiagnosticController {
    
    private static final Logger logger = LoggerFactory.getLogger(DiagnosticController.class);
    
    private final UserRepository userRepository;
    private final FirebaseSyncService firebaseSyncService;
    
    public DiagnosticController(UserRepository userRepository, FirebaseSyncService firebaseSyncService) {
        this.userRepository = userRepository;
        this.firebaseSyncService = firebaseSyncService;
    }
    
    @GetMapping("/firebase-status")
    public ResponseEntity<?> checkFirebaseStatus() {
        logger.info("Checking Firebase status");
        
        try {
            // Check if Firebase is initialized
            boolean isFirebaseInitialized = !FirebaseApp.getApps().isEmpty();
            
            Map<String, Object> response = new HashMap<>();
            response.put("firebaseInitialized", isFirebaseInitialized);
            
            if (isFirebaseInitialized) {
                // Try to list a few users to test connection
                try {
                    ListUsersPage page = FirebaseAuth.getInstance().listUsersAsync(null).get();
                    int userCount = 0;
                    for (UserRecord user : page.getValues()) {
                        userCount++;
                        if (userCount >= 5) break; // Only check first 5 users
                    }
                    response.put("firebaseConnection", "Successful");
                    response.put("sampleUserCount", userCount);
                } catch (Exception e) {
                    response.put("firebaseConnection", "Failed");
                    response.put("firebaseError", e.getMessage());
                }
            } else {
                response.put("firebaseConnection", "Not initialized");
            }
            
            logger.info("Firebase status check completed: {}", response);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error checking Firebase status: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @GetMapping("/database-status")
    public ResponseEntity<?> checkDatabaseStatus() {
        logger.info("Checking database status");
        
        try {
            // Test database connection
            long userCount = userRepository.count();
            
            Map<String, Object> response = new HashMap<>();
            response.put("databaseConnection", "Successful");
            response.put("userCount", userCount);
            
            logger.info("Database status check completed: {} users found", userCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error checking database status: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("databaseConnection", "Failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/test-single-user-sync")
    public ResponseEntity<?> testSingleUserSync(@RequestBody Map<String, String> requestData) {
        logger.info("Testing single user sync");
        
        try {
            String uid = requestData.get("uid");
            if (uid == null || uid.isEmpty()) {
                return ResponseEntity.badRequest().body("UID is required");
            }
            
            // Try to sync a single user
            User user = firebaseSyncService.syncFirebaseUserToDB(uid);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Success");
            response.put("user", user);
            
            logger.info("Single user sync test completed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error during single user sync test: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @GetMapping("/test-firebase-list-users")
    public ResponseEntity<?> testFirebaseListUsers() {
        logger.info("Testing Firebase user listing");
        
        try {
            // Try to list users from Firebase
            ListUsersPage page = FirebaseAuth.getInstance().listUsersAsync(null).get();
            
            int userCount = 0;
            StringBuilder userSample = new StringBuilder();
            
            for (UserRecord user : page.getValues()) {
                userCount++;
                userSample.append(String.format("User %d: UID=%s, Email=%s, Name=%s%n", 
                    userCount, user.getUid(), user.getEmail(), user.getDisplayName()));
                
                if (userCount >= 10) break; // Limit to first 10 users
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Success");
            response.put("totalUsersInFirebase", userCount);
            response.put("sampleUsers", userSample.toString());
            
            logger.info("Firebase user listing test completed: {} users found", userCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error during Firebase user listing test: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/manual-sync-all-users")
    public ResponseEntity<?> manualSyncAllUsers() {
        logger.info("Manual sync all users endpoint called");
        
        try {
            var syncedUsers = firebaseSyncService.syncAllFirebaseUsers();
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Manual sync completed");
            response.put("syncedUserCount", syncedUsers.size());
            
            logger.info("Manual sync all users completed. Synced {} users", syncedUsers.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error during manual sync all users: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/manual-sync-user")
    public ResponseEntity<?> manualSyncUser(@RequestBody Map<String, String> requestData) {
        logger.info("Manual sync user endpoint called");
        
        try {
            String uid = requestData.get("uid");
            if (uid == null || uid.isEmpty()) {
                return ResponseEntity.badRequest().body("UID is required");
            }
            
            User user = firebaseSyncService.syncFirebaseUserToDB(uid);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Success");
            response.put("message", "User synced successfully");
            response.put("user", user);
            
            logger.info("Manual sync user completed for UID: {}", uid);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error during manual sync user: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "Failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}