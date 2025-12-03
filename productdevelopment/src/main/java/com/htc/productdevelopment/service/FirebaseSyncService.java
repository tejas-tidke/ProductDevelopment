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
            
            // Check if user already exists in database by email before creating in Firebase
            if (email != null && !email.isEmpty()) {
                Optional<User> existingUserByEmail = userRepository.findByEmail(email);
                if (existingUserByEmail.isPresent()) {
                    logger.warn("User already exists in database by email: {}", email);
                    throw new Exception("User already exists with this email. Please sign in instead of creating a new account.");
                }
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
        
        // Check if user already exists in database by UID
        Optional<User> existingUser = userRepository.findByUid(uid);
        if (existingUser.isPresent()) {
            // Update existing user data
            logger.info("User already exists in database by UID, updating information");
            User user = existingUser.get();
            if (email != null && !email.isEmpty()) {
                user.setEmail(email);
            }
            if (name != null && !name.isEmpty()) {
                user.setName(name);
            }
            // Note: We don't update the role here as it might have been set separately
            User savedUser = userRepository.save(user);
            logger.info("User updated successfully: {}", savedUser.getUid());
            return savedUser;
        }
        
        // Check if user already exists in database by email
        if (email != null && !email.isEmpty()) {
            Optional<User> existingUserByEmail = userRepository.findByEmail(email);
            if (existingUserByEmail.isPresent()) {
                // Update existing user with UID
                logger.info("User already exists in database by email, updating UID");
                User user = existingUserByEmail.get();
                user.setUid(uid);
                if (name != null && !name.isEmpty()) {
                    user.setName(name);
                }
                User savedUser = userRepository.save(user);
                logger.info("User updated successfully: {}", savedUser.getUid());
                return savedUser;
            }
        }
        
        try {
            // Fetch user from Firebase
            UserRecord firebaseUser = FirebaseAuth.getInstance().getUserAsync(uid).get();
            logger.debug("Fetched Firebase user: {} - {}", firebaseUser.getUid(), firebaseUser.getEmail());
            
            // Create new user with data from Firebase
            logger.info("Creating new user in database from Firebase data");
            User newUser = userService.createUser(
                firebaseUser.getUid(),
                firebaseUser.getEmail(),
                firebaseUser.getDisplayName() != null ? firebaseUser.getDisplayName() : ""
            );
            logger.info("New user created successfully: {}", newUser.getUid());
            return newUser;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error fetching user from Firebase: {}", e.getMessage(), e);
            throw new Exception("Error fetching user from Firebase", e);
        } catch (RuntimeException e) {
            // If user already exists, update instead
            logger.warn("User creation failed, checking for existing user: {}", e.getMessage());
            existingUser = userRepository.findByUid(uid);
            if (existingUser.isPresent()) {
                User user = existingUser.get();
                if (email != null && !email.isEmpty()) {
                    user.setEmail(email);
                }
                if (name != null && !name.isEmpty()) {
                    user.setName(name);
                }
                User savedUser = userRepository.save(user);
                logger.info("User updated successfully: {}", savedUser.getUid());
                return savedUser;
            } else {
                // Also check by email
                if (email != null && !email.isEmpty()) {
                    Optional<User> existingUserByEmail = userRepository.findByEmail(email);
                    if (existingUserByEmail.isPresent()) {
                        User user = existingUserByEmail.get();
                        user.setUid(uid);
                        if (name != null && !name.isEmpty()) {
                            user.setName(name);
                        }
                        User savedUser = userRepository.save(user);
                        logger.info("User updated successfully: {}", savedUser.getUid());
                        return savedUser;
                    }
                }
                throw e;
            }
        }
    }

    /**
     * Automatically sync user with default role if not already in database
     * @param uid Firebase user ID
     * @return User entity stored in local database
     */
    public User autoSyncUser(String uid) {
        logger.info("Auto-syncing user with UID: {}", uid);
        
        // Check if user already exists in database by UID
        Optional<User> existingUser = userRepository.findByUid(uid);
        if (existingUser.isPresent()) {
            logger.debug("User already exists in database by UID: {}", uid);
            return existingUser.get();
        }
        
        try {
            // If not exists, fetch from Firebase
            logger.debug("User not found in database, fetching from Firebase: {}", uid);
            UserRecord firebaseUser = FirebaseAuth.getInstance().getUserAsync(uid).get();
            logger.debug("Successfully fetched Firebase user: {} ({})", firebaseUser.getEmail(), firebaseUser.getDisplayName());
            
            // Check if user already exists by email before creating
            if (firebaseUser.getEmail() != null && !firebaseUser.getEmail().isEmpty()) {
                Optional<User> existingUserByEmail = userRepository.findByEmail(firebaseUser.getEmail());
                if (existingUserByEmail.isPresent()) {
                    logger.debug("User already exists in database by email: {}", firebaseUser.getEmail());
                    User user = existingUserByEmail.get();
                    // Update UID if it's missing
                    if (user.getUid() == null || user.getUid().isEmpty()) {
                        user.setUid(firebaseUser.getUid());
                        user = userRepository.save(user);
                        logger.info("Updated user UID: {}", user.getUid());
                    }
                    return user;
                }
            }
            
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
                // Also check by email
                try {
                    UserRecord firebaseUser = FirebaseAuth.getInstance().getUserAsync(uid).get();
                    if (firebaseUser.getEmail() != null && !firebaseUser.getEmail().isEmpty()) {
                        Optional<User> existingUserByEmail = userRepository.findByEmail(firebaseUser.getEmail());
                        if (existingUserByEmail.isPresent()) {
                            return existingUserByEmail.get();
                        }
                    }
                } catch (Exception ex) {
                    logger.warn("Error checking for existing user by email: {}", ex.getMessage());
                }
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
     * Check if an email domain is likely to be valid by checking against common providers
     * @param email User email
     * @return true if domain is likely valid, false otherwise
     */
    public boolean isEmailDomainLikelyValid(String email) {
        logger.info("Checking if email domain is likely valid for email: {}", email);
        
        // Common valid email domains
        String[] validDomains = {
            "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", 
            "aol.com", "icloud.com", "mail.com", "protonmail.com",
            "yandex.com", "qq.com", "163.com", "126.com"
        };
        
        try {
            // Extract domain from email
            String domain = email.substring(email.lastIndexOf("@") + 1).toLowerCase();
            
            // Check if domain matches any of our known valid domains
            for (String validDomain : validDomains) {
                if (domain.equals(validDomain)) {
                    logger.info("Domain {} is in our list of known valid domains", domain);
                    return true;
                }
            }
            
            // For unknown domains, we'll assume they're valid but log a warning
            logger.warn("Domain {} is not in our list of known valid domains. Assuming it's valid.", domain);
            return true;
        } catch (Exception e) {
            logger.error("Error validating email domain for email: {}. Error: {}", email, e.getMessage());
            // If we can't validate, we'll assume it's valid to avoid blocking legitimate emails
            return true;
        }
    }
}	