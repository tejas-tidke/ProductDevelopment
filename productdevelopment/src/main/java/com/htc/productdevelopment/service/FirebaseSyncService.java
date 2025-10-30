package com.htc.productdevelopment.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.ListUsersPage;
import com.google.firebase.auth.UserRecord.CreateRequest;
import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.ExecutionException;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Service class for synchronizing Firebase users with local database
 * This service handles creating, syncing, and managing Firebase users
 */
@Service
public class FirebaseSyncService {
    
    // Logger for tracking service operations
    private static final Logger logger = LoggerFactory.getLogger(FirebaseSyncService.class);
    
    // Repositories and services for database and user operations
    private final UserRepository userRepository;
    private final UserService userService;
    
    /**
     * Constructor to initialize dependencies
     * @param userRepository Repository for database operations
     * @param userService Service for user operations
     */
    public FirebaseSyncService(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }
    
    /**
     * Create a new user in Firebase and sync to local database
     * @param email User email
     * @param password User password
     * @param displayName User display name
     * @param role User role (ADMIN or USER)
     * @return User entity stored in local database
     */
    public User createFirebaseUser(String email, String password, String displayName, User.Role role) throws Exception {
        logger.info("Creating new Firebase user with email: {}", email);
        
        try {
            // Create user in Firebase
            CreateRequest request = new CreateRequest()
                .setEmail(email)
                .setEmailVerified(false)
                .setPassword(password)
                .setDisplayName(displayName);
            
            UserRecord userRecord = FirebaseAuth.getInstance().createUserAsync(request).get();
            logger.info("Firebase user created successfully with UID: {}", userRecord.getUid());
            
            // Sync user to local database with specified role
            User user = userService.createUser(
                userRecord.getUid(),
                userRecord.getEmail(),
                userRecord.getDisplayName() != null ? userRecord.getDisplayName() : ""
            );
            
            // Update the role in database (createUser sets default role to USER)
            if (role != User.Role.USER) {
                user = userService.updateUserRole(user.getUid(), role);
            }
            
            logger.info("User created and synced to database with role: {}", role);
            return user;
        } catch (Exception e) {
            logger.error("Error creating Firebase user: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Sync user data from Firebase to local database
     * @param uid Firebase user ID
     * @return User entity stored in local database
     */
    public User syncFirebaseUserToDB(String uid) throws InterruptedException, ExecutionException {
        logger.info("Syncing Firebase user with UID: {}", uid);
        
        try {
            // Fetch user data from Firebase
            logger.debug("Fetching user data from Firebase for UID: {}", uid);
            UserRecord firebaseUser = FirebaseAuth.getInstance().getUserAsync(uid).get();
            logger.debug("Successfully fetched Firebase user: {} ({})", firebaseUser.getEmail(), firebaseUser.getDisplayName());
            
            // Check if user already exists in local database
            boolean exists = userRepository.existsByUid(uid);
            logger.debug("User exists in local database: {}", exists);
            
            if (exists) {
                // Update existing user data
                logger.info("User already exists in database, updating information");
                User existingUser = userRepository.findByUid(uid).orElseThrow();
                existingUser.setEmail(firebaseUser.getEmail() != null ? firebaseUser.getEmail() : "");
                existingUser.setName(firebaseUser.getDisplayName() != null ? firebaseUser.getDisplayName() : "");
                // Note: We don't update the role here as it might have been set separately
                User savedUser = userRepository.save(existingUser);
                logger.info("User updated successfully: {}", savedUser.getUid());
                return savedUser;
            } else {
                // Create new user with data from Firebase
                logger.info("Creating new user in database from Firebase data");
                try {
                    User newUser = userService.createUser(
                        firebaseUser.getUid(),
                        firebaseUser.getEmail(),
                        firebaseUser.getDisplayName() != null ? firebaseUser.getDisplayName() : ""
                    );
                    logger.info("New user created successfully: {}", newUser.getUid());
                    return newUser;
                } catch (RuntimeException e) {
                    // If user already exists, update instead
                    logger.warn("User creation failed, checking if user exists: {}", e.getMessage());
                    Optional<User> existingUser = userRepository.findByUid(uid);
                    if (existingUser.isPresent()) {
                        User user = existingUser.get();
                        user.setEmail(firebaseUser.getEmail() != null ? firebaseUser.getEmail() : "");
                        user.setName(firebaseUser.getDisplayName() != null ? firebaseUser.getDisplayName() : "");
                        User savedUser = userRepository.save(user);
                        logger.info("Existing user updated after creation conflict: {}", savedUser.getUid());
                        return savedUser;
                    } else {
                        logger.error("User creation failed and user not found: {}", e.getMessage());
                        throw e;
                    }
                }
            }
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error fetching user from Firebase: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during user sync: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Verify Firebase token and sync user data
     * @param idToken Firebase ID token
     * @return User entity stored in local database
     */
    public User syncFirebaseUserByToken(String idToken) throws Exception {
        logger.info("Syncing Firebase user by token");
        
        try {
            // Verify Firebase ID token
            logger.debug("Verifying Firebase ID token");
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdTokenAsync(idToken).get();
            String uid = decodedToken.getUid();
            logger.debug("Token verified successfully for UID: {}", uid);
            
            // Sync user data
            return syncFirebaseUserToDB(uid);
        } catch (Exception e) {
            logger.error("Error syncing Firebase user by token: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Get or create user in local database based on Firebase data
     * @param uid Firebase user ID
     * @return User entity
     */
    public User getOrCreateUserFromFirebase(String uid) {
        logger.info("Getting or creating user from Firebase for UID: {}", uid);
        
        // Check if user exists in local database
        Optional<User> existingUser = userRepository.findByUid(uid);
        if (existingUser.isPresent()) {
            logger.debug("User already exists in database: {}", uid);
            return existingUser.get();
        }
        
        try {
            // If not exists, fetch from Firebase and create
            logger.debug("User not found in database, fetching from Firebase: {}", uid);
            UserRecord firebaseUser = FirebaseAuth.getInstance().getUserAsync(uid).get();
            logger.debug("Successfully fetched Firebase user: {} ({})", firebaseUser.getEmail(), firebaseUser.getDisplayName());
            
            User newUser = userService.createUser(
                firebaseUser.getUid(),
                firebaseUser.getEmail(),
                firebaseUser.getDisplayName() != null ? firebaseUser.getDisplayName() : ""
            );
            logger.info("New user created from Firebase data: {}", newUser.getUid());
            return newUser;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error fetching user from Firebase: {}", e.getMessage(), e);
            throw new RuntimeException("Error fetching user from Firebase", e);
        } catch (RuntimeException e) {
            // If user already exists in DB (race condition), fetch it
            logger.warn("User creation failed, checking for existing user: {}", e.getMessage());
            Optional<User> user = userRepository.findByUid(uid);
            if (user.isPresent()) {
                logger.info("Returning existing user after creation conflict: {}", user.get().getUid());
                return user.get();
            } else {
                logger.error("User creation failed and user not found: {}", e.getMessage());
                throw e;
            }
        }
    }
    
    /**
     * Sync all Firebase users to local database
     * @return List of users synced to local database
     */
    public List<User> syncAllFirebaseUsers() throws Exception {
        logger.info("Syncing all Firebase users to local database");
        
        try {
            List<User> syncedUsers = new ArrayList<>();
            
            // Get all users from Firebase (paginated)
            ListUsersPage page = FirebaseAuth.getInstance().listUsersAsync(null).get();
            
            // Process each user
            for (UserRecord userRecord : page.iterateAll()) {
                try {
                    // Sync each user to local database
                    User user = syncFirebaseUserToDB(userRecord.getUid());
                    syncedUsers.add(user);
                    logger.debug("Synced Firebase user: {} ({})", userRecord.getUid(), userRecord.getEmail());
                } catch (Exception e) {
                    logger.error("Error syncing Firebase user {}: {}", userRecord.getUid(), e.getMessage(), e);
                    // Continue with other users even if one fails
                }
            }
            
            logger.info("Successfully synced {} Firebase users to local database", syncedUsers.size());
            return syncedUsers;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error listing Firebase users: {}", e.getMessage(), e);
            throw new Exception("Failed to sync all Firebase users: " + e.getMessage(), e);
        }
    }
    
    /**
     * Add this method to automatically sync Firebase user with default role
     * @param uid Firebase user ID
     * @return User entity stored in local database
     */
    public User autoSyncFirebaseUser(String uid) throws Exception {
        logger.info("Auto-syncing Firebase user with default role: {}", uid);
        
        try {
            // Check if user already exists in database
            Optional<User> existingUser = userRepository.findByUid(uid);
            if (existingUser.isPresent()) {
                logger.debug("User already exists in database: {}", uid);
                return existingUser.get();
            }
            
            // Fetch user from Firebase
            UserRecord firebaseUser = FirebaseAuth.getInstance().getUser(uid);
            logger.debug("Fetched Firebase user: {} - {}", firebaseUser.getUid(), firebaseUser.getEmail());
            
            // Create new user with default role (USER)
            User newUser = new User();
            newUser.setUid(firebaseUser.getUid());
            newUser.setEmail(firebaseUser.getEmail());
            newUser.setName(firebaseUser.getDisplayName() != null ? firebaseUser.getDisplayName() : "");
            
            // Check if this is the first user (admin)
            long userCount = userRepository.count();
            if (userCount == 0) {
                logger.info("First user detected, assigning ADMIN role");
                newUser.setRole(User.Role.ADMIN);
            } else {
                newUser.setRole(User.Role.USER); // Default role
            }
            
            newUser.setActive(true);
            newUser.setCreatedAt(new java.util.Date());
            newUser.setUpdatedAt(new java.util.Date());
            
            User savedUser = userRepository.save(newUser);
            logger.info("Auto-synced Firebase user to database with role {}: {}", savedUser.getRole(), uid);
            return savedUser;
        } catch (Exception e) {
            logger.error("Error auto-syncing Firebase user: {}", e.getMessage(), e);
            throw new Exception("Failed to auto-sync Firebase user: " + e.getMessage(), e);
        }
    }
}