package com.htc.productdevelopment.util;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.ListUsersPage;
import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.service.FirebaseSyncService;
import com.htc.productdevelopment.repository.UserRepository;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.ExecutionException;

@Component
public class ManualSyncUtil {
    
    private static final Logger logger = LoggerFactory.getLogger(ManualSyncUtil.class);
    
    private final FirebaseSyncService firebaseSyncService;
    private final UserRepository userRepository;
    
    public ManualSyncUtil(FirebaseSyncService firebaseSyncService, UserRepository userRepository) {
        this.firebaseSyncService = firebaseSyncService;
        this.userRepository = userRepository;
    }
    
    /**
     * Manually sync all Firebase users to the database
     * This is a simpler implementation for debugging purposes
     */
    public void manuallySyncAllUsers() {
        logger.info("Starting manual sync of all Firebase users");
        
        try {
            // Check Firebase connection
            if (FirebaseAuth.getInstance() == null) {
                logger.error("Firebase not initialized");
                return;
            }
            
            logger.info("Firebase connection verified");
            
            // Use FirebaseSyncService to sync all users
            var syncedUsers = firebaseSyncService.syncAllFirebaseUsers();
            logger.info("Manual sync completed. Synced {} users", syncedUsers.size());
            
        } catch (Exception e) {
            logger.error("Unexpected error during manual sync: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Sync a single user by UID using FirebaseSyncService
     */
    public boolean manuallySyncUser(String uid) {
        logger.info("Manually syncing user with UID: {}", uid);
        
        try {
            // Use FirebaseSyncService to sync a single user
            User user = firebaseSyncService.syncFirebaseUserToDB(uid);
            logger.info("Successfully synced user to database: {} ({})", user.getEmail(), user.getUid());
            return true;
        } catch (Exception e) {
            logger.error("Error syncing user {}: {}", uid, e.getMessage(), e);
            return false;
        }
    }
}