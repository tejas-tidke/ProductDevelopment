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

@Service
public class FirebaseSyncService {
    
    private static final Logger logger = LoggerFactory.getLogger(FirebaseSyncService.class);
    
    private final UserRepository userRepository;
    private final UserService userService;
    
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
        logger.info("Attempting to sync Firebase user with UID: {}", uid);
        
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
        logger.info("Attempting to sync Firebase user by token");
        
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
     * Sync all users from Firebase to local database
     * This method fetches all users from Firebase and syncs them to the local database
     */
    public List<User> syncAllFirebaseUsers() {
        logger.info("Starting sync of all Firebase users to database");
        List<User> syncedUsers = new ArrayList<>();
        
        try {
            // List all Firebase users (paginated)
            ListUsersPage page = FirebaseAuth.getInstance().listUsersAsync(null).get();
            
            // Process the first page
            processUserPage(page, syncedUsers);
            
            // Process next pages if they exist
            ListUsersPage nextPage = page.getNextPage();
            while (nextPage != null) {
                processUserPage(nextPage, syncedUsers);
                nextPage = nextPage.getNextPage();
            }
            
            logger.info("Finished syncing Firebase users");
            
            return syncedUsers;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error syncing all Firebase users: {}", e.getMessage(), e);
            throw new RuntimeException("Error syncing all Firebase users", e);
        } catch (Exception e) {
            logger.error("Unexpected error during Firebase user sync: {}", e.getMessage(), e);
            throw new RuntimeException("Unexpected error during Firebase user sync", e);
        }
    }
    
    /**
     * Process a page of Firebase users
     */
    private void processUserPage(ListUsersPage page, List<User> syncedUsers) {
        for (UserRecord user : page.getValues()) {
            logger.debug("Processing Firebase user: {} ({})", user.getEmail(), user.getUid());
            
            try {
                // Check if user already exists in local database
                if (!userRepository.existsByUid(user.getUid())) {
                    // Create new user with data from Firebase
                    User newUser = userService.createUser(
                        user.getUid(),
                        user.getEmail(),
                        user.getDisplayName() != null ? user.getDisplayName() : ""
                    );
                    syncedUsers.add(newUser);
                    logger.info("Synced Firebase user to database: {} ({})", user.getEmail(), user.getUid());
                } else {
                    logger.debug("User already exists in database, skipping: {} ({})", user.getEmail(), user.getUid());
                }
            } catch (Exception e) {
                logger.error("Error syncing Firebase user {}: {} - {}", user.getUid(), e.getMessage(), e);
            }
        }
    }
    
    /**
     * Get all users from local database
     * @return List of all users
     */
    public List<User> getAllUsers() {
        logger.debug("Fetching all users from database");
        return userRepository.findAll();
    }
    
    /**
     * Get all users with a specific role
     * @param role the role to filter by
     * @return List of users with the specified role
     */
    public List<User> getUsersByRole(User.Role role) {
        logger.debug("Fetching users by role: {}", role);
        return userService.getUsersByRole(role);
    }
    
    /**
     * Get all active users
     * @return List of active users
     */
    public List<User> getActiveUsers() {
        logger.debug("Fetching active users from database");
        return userService.getUsersByActiveStatus(true);
    }
    
    /**
     * Get all inactive users
     * @return List of inactive users
     */
    public List<User> getInactiveUsers() {
        logger.debug("Fetching inactive users from database");
        return userService.getUsersByActiveStatus(false);
    }
    
    /**
     * Check database connection and schema
     * @return true if database is properly configured
     */
    public boolean checkDatabaseConnection() {
        try {
            logger.info("Checking database connection and schema");
            // Try to fetch user count
            long count = userRepository.count();
            logger.debug("Database connection successful, user count: {}", count);
            return true;
        } catch (Exception e) {
            logger.error("Database connection failed: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Validate database schema
     */
    public void validateSchema() {
        logger.info("Validating database schema");
        try {
            // Try to create a test user to validate schema
            User testUser = new User();
            testUser.setUid("test-uid-" + System.currentTimeMillis());
            testUser.setEmail("test@example.com");
            testUser.setName("Test User");
            testUser.setRole(User.Role.USER);
            
            User savedUser = userRepository.save(testUser);
            logger.info("Schema validation successful, test user created with ID: {}", savedUser.getId());
            
            // Clean up test user
            userRepository.delete(savedUser);
            logger.info("Test user cleaned up");
        } catch (Exception e) {
            logger.error("Schema validation failed: {}", e.getMessage(), e);
        }
    }
}