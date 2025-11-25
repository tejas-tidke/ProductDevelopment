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
import com.google.firebase.auth.ExportedUserRecord;


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
     * Create a new user in Firebase and sync to local database
     * @param email User email
     * @param password User password
     * @param displayName User display name
     * @param role User role (SUPER_ADMIN, ADMIN, APPROVER, or REQUESTER)
     * @return User entity stored in local database
     */
    public User createFirebaseUser(String email, String password, String displayName, User.Role role) throws Exception {
        logger.info("Creating new Firebase user with email: {}", email);
        
        try {
            // Check if Firebase is properly initialized
            if (FirebaseApp.getApps().isEmpty()) {
                logger.error("Firebase not initialized. Check firebase-service-account.json file.");
                throw new Exception("Firebase not properly configured. Please check firebase-service-account.json file.");
            }
            
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
            
            // Update the role in database (createUser sets default role to REQUESTER)
            if (role != User.Role.REQUESTER) {
                user = userService.updateUserRole(user.getUid(), role);
            }
            
            // If this is the first user, set them as SUPER_ADMIN and assign to "Cost Room" organization
            long userCount = userRepository.count();
            if (userCount == 1) { // This is the first user
                user.setRole(User.Role.SUPER_ADMIN);
                
                // Find or create "Cost Room" organization
                Optional<Organization> costRoomOrg = organizationService.getOrganizationByName("Cost Room");
                Organization org;
                if (costRoomOrg.isPresent()) {
                    org = costRoomOrg.get();
                } else {
                    org = organizationService.createOrganization("Cost Room", null);
                }
                user.setOrganization(org);
                
                user = userService.updateUserById(user.getId(), user);
            }
            
            logger.info("User created and synced to database with role: {}", role);
            return user;
        } catch (Exception e) {
            logger.error("Error creating Firebase user: {}", e.getMessage(), e);
            // Re-throw with more context if it's a Firebase initialization issue
            if (e.getMessage().contains("FirebaseApp")) {
                throw new Exception("Firebase not properly configured. Please check firebase-service-account.json file.", e);
            }
            throw e;
        }
    }

    /**
     * Sync a specific user from Firebase to local database
     * @param uid Firebase user ID
     * @param email User email (optional)
     * @param name User name (optional)
     * @return User entity stored in local database
     */
    public User syncUser(String uid, String email, String name) throws Exception {
        logger.info("Syncing user with UID: {}", uid);
        
        try {
            // Fetch user from Firebase
            UserRecord firebaseUser = FirebaseAuth.getInstance().getUserAsync(uid).get();
            logger.debug("Fetched Firebase user: {} - {}", firebaseUser.getUid(), firebaseUser.getEmail());
            
            // Check if user already exists in database
            Optional<User> existingUser = userRepository.findByUid(uid);
            if (existingUser.isPresent()) {
                // Update existing user data
                logger.info("User already exists in database, updating information");
                User user = existingUser.get();
                user.setEmail(firebaseUser.getEmail() != null ? firebaseUser.getEmail() : "");
                user.setName(firebaseUser.getDisplayName() != null ? firebaseUser.getDisplayName() : "");
                // Note: We don't update the role here as it might have been set separately
                User savedUser = userRepository.save(user);
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
                    logger.warn("User creation failed, checking for existing user: {}", e.getMessage());
                    existingUser = userRepository.findByUid(uid);
                    if (existingUser.isPresent()) {
                        User user = existingUser.get();
                        user.setEmail(firebaseUser.getEmail() != null ? firebaseUser.getEmail() : "");
                        user.setName(firebaseUser.getDisplayName() != null ? firebaseUser.getDisplayName() : "");
                        User savedUser = userRepository.save(user);
                        logger.info("User updated successfully: {}", savedUser.getUid());
                        return savedUser;
                    } else {
                        throw e;
                    }
                }
            }
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error fetching user from Firebase: {}", e.getMessage(), e);
            throw new Exception("Error fetching user from Firebase", e);
        }
    }

    /**
     * Automatically sync user with default role if not already in database
     * @param uid Firebase user ID
     * @return User entity stored in local database
     */
    public User autoSyncUser(String uid) {
        logger.info("Auto-syncing user with UID: {}", uid);
        
        // Check if user already exists in database
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
            existingUser = userRepository.findByUid(uid);
            if (existingUser.isPresent()) {
                return existingUser.get();
            } else {
                throw e;
            }
        }
    }

    /**
     * Sync all users from Firebase to local database
     * @return List of users stored in local database
     */
    public List<User> syncAllFirebaseUsers() throws Exception {
        logger.info("Syncing all Firebase users to local database");
        
        try {
            // Fetch all users from Firebase (limited to 1000 for now)
        	Iterable<ExportedUserRecord> firebaseUsersIterable = FirebaseAuth.getInstance().listUsersAsync(null).get().getValues();
        	List<ExportedUserRecord> firebaseUsers = com.google.common.collect.Lists.newArrayList(firebaseUsersIterable);
            logger.debug("Fetched {} users from Firebase", firebaseUsers.size());
            
            // Sync each user to local database
            for (ExportedUserRecord firebaseUser : firebaseUsers) { 
                try {
                    syncUser(firebaseUser.getUid(), firebaseUser.getEmail(), firebaseUser.getDisplayName());
                } catch (Exception e) {
                    logger.warn("Failed to sync user {}: {}", firebaseUser.getUid(), e.getMessage());
                }
            }
            
            // Return all users from local database
            List<User> allUsers = userService.getAllUsers();
            logger.info("Successfully synced {} users to local database", allUsers.size());
            return allUsers;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error fetching users from Firebase: {}", e.getMessage(), e);
            throw new Exception("Error fetching users from Firebase", e);
        }
    }
}	