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

import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.FirebaseAuth;


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
//    private Department getDepartmentFromId(Integer deptId) {
//        if (deptId == null) return null;
//        return departmentRepository.findById(deptId)
//                .orElseThrow(() ->
//                        new RuntimeException("Department not found with id: " + deptId));
//    }
    
    public Department getDepartmentFromId(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department ID invalid: " + id));
    }


    // -------------------------------------------------------
    // Get All Users
    // -------------------------------------------------------
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserByUid(String uid) {
        return userRepository.findByUid(uid);
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

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

    public boolean isSuperAdmin(String uid) {
        return userRepository.findByUid(uid)
                .map(u -> u.getRole() == User.Role.SUPER_ADMIN)
                .orElse(false);
    }

    public boolean isAdmin(String uid) {
        return userRepository.findByUid(uid)
                .map(u -> u.getRole() == User.Role.ADMIN)
                .orElse(false);
    }

    public boolean isApprover(String uid) {
        return userRepository.findByUid(uid)
                .map(u -> u.getRole() == User.Role.APPROVER)
                .orElse(false);
    }

    public boolean isRequester(String uid) {
        return userRepository.findByUid(uid)
                .map(u -> u.getRole() == User.Role.REQUESTER)
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

        // Delete associated invitations
        deleteInvitationsByEmail(user.getEmail());

        userRepository.delete(user);
    }

    public void deleteUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        // Delete associated invitations
        deleteInvitationsByEmail(user.getEmail());

        userRepository.delete(user);
    }
    
    // Delete invitations by email
    private void deleteInvitationsByEmail(String email) {
        // We need the invitation repository for this, but it's not injected
        // We'll handle this in the controller by calling the invitation service
    }
    
 // -------------------------------------------------------------
    // 1️⃣ Create user in Firebase
    // -------------------------------------------------------------
    public User createUserInFirebase(String email, String password, String fullName) throws Exception {

        UserRecord.CreateRequest req = new UserRecord.CreateRequest()
                .setEmail(email)
                .setPassword(password)
                .setDisplayName(fullName)
                .setEmailVerified(true);

        UserRecord rec = FirebaseAuth.getInstance().createUser(req);

        // Returning a temporary User object containing Firebase UID
        User u = new User();
        u.setUid(rec.getUid());
        u.setEmail(email);
        u.setName(fullName);

        return u;
    }


    // -------------------------------------------------------------
    // 2️⃣ Save user in DB
    // -------------------------------------------------------------
    public User saveUserToDB(String uid,
                             String email,
                             String fullName,
                             User.Role role) {

        // Check if user with this email already exists
        Optional<User> existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            // Update existing user with Firebase UID and other details
            User user = existingUser.get();
            user.setUid(uid);
            user.setName(fullName);
            user.setRole(role);
            user.setActive(true);
            user.setUpdatedAt(new java.util.Date());
            
            return userRepository.save(user);
        }

        User u = new User();
        u.setUid(uid);
        u.setEmail(email);
        u.setName(fullName);
        u.setRole(role);
        u.setActive(true);
        u.setCreatedAt(new java.util.Date());
        u.setUpdatedAt(new java.util.Date());

        return userRepository.save(u);
    }


    // -------------------------------------------------------------
    // 3️⃣ Fetch Department by ID (public)
    // -------------------------------------------------------------
    
}