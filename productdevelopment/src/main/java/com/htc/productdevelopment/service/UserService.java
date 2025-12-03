package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.model.Department;
import com.htc.productdevelopment.model.Organization;
import com.htc.productdevelopment.repository.UserRepository;
import com.htc.productdevelopment.repository.DepartmentRepository;
import com.htc.productdevelopment.repository.OrganizationRepository;

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
    private final OrganizationService organizationService;

    public UserService(UserRepository userRepository,
                       DepartmentRepository departmentRepository,
                       OrganizationService organizationService) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.organizationService = organizationService;
    }

    // -------------------------------------------------------
    // Utility: Fetch department safely
    // -------------------------------------------------------
    public Department getDepartmentFromId(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department ID invalid: " + id));
    }
    
    // -------------------------------------------------------
    // Get All Departments
    // -------------------------------------------------------
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }
    
    // -------------------------------------------------------
    // Utility: Fetch organization safely
    // -------------------------------------------------------
    public Organization getOrganizationFromId(Long id) {
        // Use organizationService to get the organization repository
        // We need to add a method to OrganizationService to get organization by ID
        return organizationService.getOrganizationById(id)
                .orElseThrow(() -> new RuntimeException("Organization ID invalid: " + id));
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
        
        // If role is changed to SUPER_ADMIN, assign to "Cost Room" organization
        if (role == User.Role.SUPER_ADMIN) {
            Organization costRoomOrg = organizationService.getOrCreateCostRoomOrganization();
            user.setOrganization(costRoomOrg);
        }
        
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
            
            // If role is SUPER_ADMIN, assign to "Cost Room" organization
            if (role == User.Role.SUPER_ADMIN) {
                Organization costRoomOrg = organizationService.getOrCreateCostRoomOrganization();
                user.setOrganization(costRoomOrg);
            }
            
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

        // If this is the first user, set them as SUPER_ADMIN and assign to "Cost Room" organization
        long userCount = userRepository.count();
        if (userCount == 0) {
            u.setRole(User.Role.SUPER_ADMIN);
            
            // Find or create "Cost Room" organization
            Organization costRoomOrg = organizationService.getOrCreateCostRoomOrganization();
            u.setOrganization(costRoomOrg);
        } else if (role == User.Role.SUPER_ADMIN) {
            // For any other SUPER_ADMIN user, assign to "Cost Room" organization
            Organization costRoomOrg = organizationService.getOrCreateCostRoomOrganization();
            u.setOrganization(costRoomOrg);
        }

        return userRepository.save(u);
    }


    // -------------------------------------------------------------
    // 3️⃣ Fetch Department by ID (public)
    // -------------------------------------------------------------
    
    // -------------------------------------------------------------
    // 4️⃣ Create user (for FirebaseSyncService)
    // -------------------------------------------------------------
    public User createUser(String uid, String email, String name) {
        logger.info("Creating user with UID: {}, email: {}, name: {}", uid, email, name);
        
        // Check if user already exists by UID
        Optional<User> existingUser = userRepository.findByUid(uid);
        if (existingUser.isPresent()) {
            logger.debug("User already exists by UID: {}", uid);
            return existingUser.get();
        }
        
        // Check if user already exists by email
        if (email != null && !email.isEmpty()) {
            Optional<User> existingUserByEmail = userRepository.findByEmail(email);
            if (existingUserByEmail.isPresent()) {
                logger.debug("User already exists by email: {}", email);
                return existingUserByEmail.get();
            }
        }
        
        User user = new User();
        user.setUid(uid);
        user.setEmail(email != null ? email : "");
        user.setName(name != null ? name : "");
        
        // Set default role
        user.setRole(User.Role.REQUESTER);
        
        // If this is the first user, set them as SUPER_ADMIN and assign to "Cost Room" organization
        long userCount = userRepository.count();
        if (userCount == 0) {
            user.setRole(User.Role.SUPER_ADMIN);
            
            // Find or create "Cost Room" organization
            Organization costRoomOrg = organizationService.getOrCreateCostRoomOrganization();
            user.setOrganization(costRoomOrg);
        }
        
        user.setActive(true);
        user.setCreatedAt(new java.util.Date());
        user.setUpdatedAt(new java.util.Date());
        
        User savedUser = userRepository.save(user);
        logger.info("User created successfully: {}", savedUser.getUid());
        return savedUser;
    }

    // -------------------------------------------------------------
    // 5️⃣ Create user with role (for Admin User Management)
    // -------------------------------------------------------------
    public User createUserWithRole(String email, String password, String name, User.Role role) throws Exception {
        // Create user in Firebase
        User firebaseUser = createUserInFirebase(email, password, name);
        
        // Save user to database with specified role
        User dbUser = saveUserToDB(firebaseUser.getUid(), email, name, role);
        
        return dbUser;
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
        
        // 🔥 Set or update organization
        if (userData.getOrganization() != null && userData.getOrganization().getId() != null) {
            Organization org = getOrganizationFromId(userData.getOrganization().getId());
            user.setOrganization(org);
        } else if (userData.getRole() != null && userData.getRole() == User.Role.SUPER_ADMIN) {
            // If role is changed to SUPER_ADMIN and no organization is provided, assign to "Cost Room"
            Organization costRoomOrg = organizationService.getOrCreateCostRoomOrganization();
            user.setOrganization(costRoomOrg);
        }

        return userRepository.save(user);
    }
}