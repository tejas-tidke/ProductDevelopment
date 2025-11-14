package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.model.Department;
import com.htc.productdevelopment.repository.UserRepository;
import com.htc.productdevelopment.repository.DepartmentRepository;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;
import java.util.List;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    public UserService(UserRepository userRepository,
                       DepartmentRepository departmentRepository) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
    }

    // -------------------------------------------------------
    // Utility: Fetch department safely
    // -------------------------------------------------------
    private Department getDepartmentFromId(Integer deptId) {
        if (deptId == null) return null;
        return departmentRepository.findById(deptId)
                .orElseThrow(() ->
                        new RuntimeException("Department not found with id: " + deptId));
    }

    // -------------------------------------------------------
    // Create User
    // -------------------------------------------------------
    public User createUser(String uid, String email, String name) {
        logger.info("Creating user with UID: {}", uid);

        if (userRepository.existsByUid(uid)) {
            throw new RuntimeException("User with this UID already exists");
        }

        if (email != null && !email.isEmpty() && userRepository.existsByEmail(email)) {
            throw new RuntimeException("User with this email already exists");
        }

        User user = new User();
        user.setUid(uid);
        user.setEmail(email != null ? email : "");
        user.setName(name != null ? name : "");
        user.setRole(User.Role.USER); // default role

        return userRepository.save(user);
    }

    // -------------------------------------------------------
    public Optional<User> getUserByUid(String uid) {
        return userRepository.findByUid(uid);
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // -------------------------------------------------------
    // Update By UID
    // -------------------------------------------------------
    public User updateUser(String uid, String email, String name) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found with UID: " + uid));

        if (email != null) user.setEmail(email);
        if (name != null) user.setName(name);

        return userRepository.save(user);
    }

    // -------------------------------------------------------
    // Update by ID (Used in Admin User Management)
    // -------------------------------------------------------
    public User updateUserById(Long id, User userData) {
        logger.info("Updating user data for ID: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        if (userData.getEmail() != null) user.setEmail(userData.getEmail());
        if (userData.getName() != null) user.setName(userData.getName());
        if (userData.getRole() != null) user.setRole(userData.getRole());
        if (userData.getActive() != null) user.setActive(userData.getActive());
        if (userData.getAvatar() != null) user.setAvatar(userData.getAvatar());

        // 🔥 Set or update department
        if (userData.getDepartment() != null && userData.getDepartment().getId() != null) {
            Department dept = getDepartmentFromId(userData.getDepartment().getId());
            user.setDepartment(dept);
        }

        return userRepository.save(user);
    }

    // -------------------------------------------------------
    // Create user from raw object
    // -------------------------------------------------------
    public User createUserFromData(User userData) {
        User user = new User();
        user.setUid(userData.getUid());
        user.setEmail(userData.getEmail());
        user.setName(userData.getName());
        user.setRole(userData.getRole());
        user.setActive(userData.getActive());
        user.setAvatar(userData.getAvatar());

        // 🔥 Set department
        if (userData.getDepartment() != null && userData.getDepartment().getId() != null) {
            Department dept = getDepartmentFromId(userData.getDepartment().getId());
            user.setDepartment(dept);
        }

        return userRepository.save(user);
    }

    // -------------------------------------------------------
    public User updateUserAvatar(String uid, String avatar) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found with UID: " + uid));

        user.setAvatar(avatar != null && !avatar.isEmpty() ? avatar : null);
        return userRepository.save(user);
    }

    public User updateUserRole(String uid, User.Role role) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found with UID: " + uid));

        user.setRole(role);
        return userRepository.save(user);
    }

    public boolean isAdmin(String uid) {
        return userRepository.findByUid(uid)
                .map(u -> u.getRole() == User.Role.ADMIN)
                .orElse(false);
    }

    public boolean isUser(String uid) {
        return userRepository.findByUid(uid)
                .map(u -> u.getRole() == User.Role.USER)
                .orElse(false);
    }

    public List<User> getUsersByRole(User.Role role) {
        return userRepository.findByRole(role);
    }

    public List<User> getUsersByActiveStatus(boolean active) {
        return userRepository.findByActive(active);
    }

    public List<User> getUsersByRoleAndActiveStatus(User.Role role, boolean active) {
        return userRepository.findByRoleAndActive(role, active);
    }

    public long countUsersByRole(User.Role role) {
        return userRepository.countByRole(role);
    }

    public long countUsersByActiveStatus(boolean active) {
        return userRepository.countByActive(active);
    }

    // -------------------------------------------------------
    public User disableUser(String uid) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found with UID: " + uid));

        user.setActive(false);
        return userRepository.save(user);
    }

    public User enableUser(String uid) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found with UID: " + uid));

        user.setActive(true);
        return userRepository.save(user);
    }

    // -------------------------------------------------------
    public void deleteUser(String uid) {
        User user = userRepository.findByUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found with UID: " + uid));

        userRepository.delete(user);
    }

    public void deleteUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        userRepository.delete(user);
    }
}
