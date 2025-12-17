package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.model.Organization;
import com.htc.productdevelopment.repository.UserRepository;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.ExportedUserRecord;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.UserRecord.CreateRequest;
import com.google.common.collect.Lists;
import com.google.common.util.concurrent.ListenableFuture;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Service
public class FirebaseSyncService {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseSyncService.class);

    private final UserRepository userRepository;
    private final UserService userService;
    private final OrganizationService organizationService;

    public FirebaseSyncService(UserRepository userRepository, UserService userService, OrganizationService organizationService) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.organizationService = organizationService;
    }

    /**
     * Check if a user exists in Firebase by email
     * @param email User email
     * @return true if user exists, false otherwise
     */
    public boolean doesUserExistInFirebase(String email) {
        logger.info("Checking if user exists in Firebase with email: {}", email);
        
        try {
            // Check if Firebase is properly initialized
            if (FirebaseApp.getApps().isEmpty()) {
                logger.error("Firebase not initialized. Check firebase-service-account.json file.");
                return false;
            }
            
            // Try to get user by email
            UserRecord userRecord = FirebaseAuth.getInstance().getUserByEmail(email);
            logger.info("User found in Firebase with email: {}", email);
            return true;
        } catch (Exception e) {
            logger.debug("User not found in Firebase with email: {}. Error: {}", email, e.getMessage());
            return false;
        }
    }

    /**
     * Check if a user exists in the local database by email
     * @param email User email
     * @return true if user exists, false otherwise
     */
    public boolean doesUserExistInDatabase(String email) {
        logger.info("Checking if user exists in database with email: {}", email);
        
        try {
            Optional<User> existingUser = userRepository.findByEmail(email);
            boolean exists = existingUser.isPresent();
            if (exists) {
                logger.info("User found in database with email: {}", email);
            } else {
                logger.info("User not found in database with email: {}", email);
            }
            return exists;
        } catch (Exception e) {
            logger.error("Error checking if user exists in database with email: {}. Error: {}", email, e.getMessage());
            return false;
        }
    }
    
    /**
     * Stub method for syncFirebaseUserToDB - no longer supported
     * @param uid User ID
     * @return User
     * @throws UnsupportedOperationException always thrown
     */
    public User syncFirebaseUserToDB(String uid) {
        throw new UnsupportedOperationException("syncFirebaseUserToDB is no longer supported. Use the invitation-based flow instead.");
    }
    
    /**
     * Stub method for syncAllFirebaseUsers - no longer supported
     * @return List of users
     * @throws UnsupportedOperationException always thrown
     */
    public List<User> syncAllFirebaseUsers() {
        throw new UnsupportedOperationException("syncAllFirebaseUsers is no longer supported. Use the invitation-based flow instead.");
    }
}