package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Service class for managing user-related operations.
 * This service handles user creation, retrieval, and role management.
 */
@Service
public class UserService {
    
    // Logger for tracking service operations
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    // Repository for database operations
    private final UserRepository userRepository;
    
    /**
     * Constructor for UserService with required dependencies.
     * 
     * @param userRepository the repository for user data access
     */
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    /**
     * Creates a new user with the provided details.
     * 
     * @param uid the Firebase UID of the user
     * @param email the email of the user
     * @param name the name of the user
     * @return the created User entity
     * @throws RuntimeException if a user with the same UID or email already exists
     */
    public User createUser(String uid, String email, String name) {
        logger.info("Creating user with UID: {}", uid);
        
        // Check if user already exists by UID
        if (userRepository.existsByUid(uid)) {
            logger.warn("User creation failed: User with this UID already exists: {}", uid);
            throw new RuntimeException("User with this UID already exists");
        }
        
        // Check if user already exists by email (but allow null/empty emails)
        if (email != null && !email.isEmpty() && userRepository.existsByEmail(email)) {
            logger.warn("User creation failed: User with this email already exists: {}", email);
            throw new RuntimeException("User with this email already exists");
        }
        
        // Create new user with default USER role
        User user = new User();
        user.setUid(uid);
        user.setEmail(email != null ? email : "");
        user.setName(name != null ? name : "");
        user.setRole(User.Role.USER); // Default role is USER
        
        User savedUser = userRepository.save(user);
        logger.info("User created successfully with ID: {}", savedUser.getId());
        return savedUser;
    }
    
    /**
     * Retrieves a user by their Firebase UID.
     * 
     * @param uid the Firebase UID of the user
     * @return an Optional containing the User if found, or empty if not found
     */
    public Optional<User> getUserByUid(String uid) {
        logger.debug("Fetching user by UID: {}", uid);
        return userRepository.findByUid(uid);
    }
    
    /**
     * Retrieves a user by their email address.
     * 
     * @param email the email of the user
     * @return an Optional containing the User if found, or empty if not found
     */
    public Optional<User> getUserByEmail(String email) {
        logger.debug("Fetching user by email: {}", email);
        return userRepository.findByEmail(email);
    }
    
    /**
     * Updates the role of a user.
     * 
     * @param uid the Firebase UID of the user
     * @param role the new role for the user
     * @return the updated User entity
     * @throws RuntimeException if the user is not found
     */
    public User updateUserRole(String uid, User.Role role) {
        logger.info("Updating user role for UID: {} to {}", uid, role);
        
        Optional<User> userOptional = userRepository.findByUid(uid);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setRole(role);
            User savedUser = userRepository.save(user);
            logger.info("User role updated successfully for UID: {}", uid);
            return savedUser;
        } else {
            logger.error("User not found with UID: {}", uid);
            throw new RuntimeException("User not found with UID: " + uid);
        }
    }
    
    /**
     * Updates the email and name of a user.
     * 
     * @param uid the Firebase UID of the user
     * @param email the new email for the user (can be null to keep existing)
     * @param name the new name for the user (can be null to keep existing)
     * @return the updated User entity
     * @throws RuntimeException if the user is not found
     */
    public User updateUser(String uid, String email, String name) {
        logger.info("Updating user data for UID: {}", uid);
        
        Optional<User> userOptional = userRepository.findByUid(uid);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (email != null) user.setEmail(email);
            if (name != null) user.setName(name);
            User savedUser = userRepository.save(user);
            logger.info("User data updated successfully for UID: {}", uid);
            return savedUser;
        } else {
            logger.error("User not found with UID: {}", uid);
            throw new RuntimeException("User not found with UID: " + uid);
        }
    }
    
    /**
     * Updates the avatar of a user.
     * 
     * @param uid the Firebase UID of the user
     * @param avatar the new avatar URL for the user
     * @return the updated User entity
     * @throws RuntimeException if the user is not found
     */
    public User updateUserAvatar(String uid, String avatar) {
        logger.info("Updating user avatar for UID: {}", uid);
        
        Optional<User> userOptional = userRepository.findByUid(uid);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            // Validate avatar data
            if (avatar != null && !avatar.isEmpty()) {
                // For very large avatars, we might want to compress or resize them
                // For now, we'll just store as is but with better error handling
                try {
                    user.setAvatar(avatar);
                } catch (Exception e) {
                    logger.error("Error setting avatar for user {}: {}", uid, e.getMessage());
                    // If avatar is too large, we could implement compression here
                    // For now, we'll truncate to prevent database errors
                    String truncatedAvatar = avatar.substring(0, Math.min(avatar.length(), 65535));
                    user.setAvatar(truncatedAvatar);
                    logger.warn("Avatar truncated for user {} due to size limitations", uid);
                }
            } else {
                user.setAvatar(null);
                logger.debug("Removing avatar for user {}", uid);
            }
            User savedUser = userRepository.save(user);
            logger.info("User avatar updated successfully for UID: {}", uid);
            return savedUser;
        } else {
            logger.error("User not found with UID: {}", uid);
            throw new RuntimeException("User not found with UID: " + uid);
        }
    }
    
    /**
     * Checks if a user has the ADMIN role.
     * 
     * @param uid the Firebase UID of the user
     * @return true if the user exists and has the ADMIN role, false otherwise
     */
    public boolean isAdmin(String uid) {
        logger.debug("Checking if user is admin for UID: {}", uid);
        
        Optional<User> userOptional = userRepository.findByUid(uid);
        if (userOptional.isPresent()) {
            boolean isAdmin = User.Role.ADMIN.equals(userOptional.get().getRole());
            logger.debug("User isAdmin: {}", isAdmin);
            return isAdmin;
        }
        logger.debug("User not found, returning false for isAdmin");
        return false;
    }
    
    /**
     * Checks if a user has the USER role.
     * 
     * @param uid the Firebase UID of the user
     * @return true if the user exists and has the USER role, false otherwise
     */
    public boolean isUser(String uid) {
        logger.debug("Checking if user is regular user for UID: {}", uid);
        
        Optional<User> userOptional = userRepository.findByUid(uid);
        if (userOptional.isPresent()) {
            boolean isUser = User.Role.USER.equals(userOptional.get().getRole());
            logger.debug("User isUser: {}", isUser);
            return isUser;
        }
        logger.debug("User not found, returning false for isUser");
        return false;
    }
    
    /**
     * Retrieves all users with a specific role.
     * 
     * @param role the role to filter by
     * @return a list of users with the specified role
     */
    public List<User> getUsersByRole(User.Role role) {
        logger.debug("Fetching users by role: {}", role);
        return userRepository.findByRole(role);
    }
    
    /**
     * Retrieves all active or inactive users.
     * 
     * @param active whether to fetch active or inactive users
     * @return a list of users with the specified active status
     */
    public List<User> getUsersByActiveStatus(boolean active) {
        logger.debug("Fetching users by active status: {}", active);
        return userRepository.findByActive(active);
    }
    
    /**
     * Retrieves all users with a specific role and active status.
     * 
     * @param role the role to filter by
     * @param active whether to fetch active or inactive users
     * @return a list of users with the specified role and active status
     */
    public List<User> getUsersByRoleAndActiveStatus(User.Role role, boolean active) {
        logger.debug("Fetching users by role: {} and active status: {}", role, active);
        return userRepository.findByRoleAndActive(role, active);
    }
    
    /**
     * Counts the number of users with a specific role.
     * 
     * @param role the role to count
     * @return the count of users with the specified role
     */
    public long countUsersByRole(User.Role role) {
        logger.debug("Counting users by role: {}", role);
        return userRepository.countByRole(role);
    }
    
    /**
     * Counts the number of active or inactive users.
     * 
     * @param active whether to count active or inactive users
     * @return the count of users with the specified active status
     */
    public long countUsersByActiveStatus(boolean active) {
        logger.debug("Counting users by active status: {}", active);
        return userRepository.countByActive(active);
    }
}