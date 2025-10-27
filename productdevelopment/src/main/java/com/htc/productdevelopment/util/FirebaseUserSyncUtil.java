package com.htc.productdevelopment.util;

import com.htc.productdevelopment.service.FirebaseSyncService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Utility class to sync all existing Firebase users to the database.
 * This can be run as a command-line utility or triggered manually.
 */
@Component
public class FirebaseUserSyncUtil implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(FirebaseUserSyncUtil.class);
    
    private final FirebaseSyncService firebaseSyncService;
    
    public FirebaseUserSyncUtil(FirebaseSyncService firebaseSyncService) {
        this.firebaseSyncService = firebaseSyncService;
    }
    
    /**
     * Sync all Firebase users to the database.
     * This method can be called manually or run automatically on application startup.
     */
    public void syncAllFirebaseUsersToDatabase() {
        logger.info("Starting synchronization of all Firebase users to database");
        
        try {
            var syncedUsers = firebaseSyncService.syncAllFirebaseUsers();
            logger.info("Successfully synchronized {} Firebase users to database", syncedUsers.size());
        } catch (Exception e) {
            logger.error("Error during Firebase user synchronization: {}", e.getMessage(), e);
        }
    }
    
    /**
     * This method runs when the Spring Boot application starts.
     * You can uncomment the sync call if you want to automatically sync users on startup.
     */
    @Override
    public void run(String... args) throws Exception {
        logger.info("FirebaseUserSyncUtil initialized");
        
        // Uncomment the following line if you want to automatically sync all users on startup
        // syncAllFirebaseUsersToDatabase();
    }
}