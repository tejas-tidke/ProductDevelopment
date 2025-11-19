package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.model.Organization;
import com.htc.productdevelopment.repository.UserRepository;
import com.htc.productdevelopment.repository.DepartmentRepository;
import com.htc.productdevelopment.repository.OrganizationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationService organizationService;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testSaveUserToDB_FirstUserBecomesSuperAdmin() {
        // Arrange
        Organization costRoomOrg = new Organization();
        costRoomOrg.setId(1L);
        costRoomOrg.setName("Cost Room");

        User newUser = new User();
        newUser.setId(1L);
        newUser.setUid("test-uid");
        newUser.setEmail("test@example.com");
        newUser.setName("Test User");

        when(userRepository.count()).thenReturn(0L); // First user
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        when(organizationService.getOrCreateCostRoomOrganization()).thenReturn(costRoomOrg);
        when(userRepository.save(any(User.class))).thenReturn(newUser);

        // Act
        User result = userService.saveUserToDB("test-uid", "test@example.com", "Test User", User.Role.REQUESTER);

        // Assert
        assertNotNull(result);
        assertEquals(User.Role.SUPER_ADMIN, result.getRole());
        assertNotNull(result.getOrganization());
        assertEquals("Cost Room", result.getOrganization().getName());
        verify(organizationService, times(1)).getOrCreateCostRoomOrganization();
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testSaveUserToDB_SuperAdminAssignedToCostRoom() {
        // Arrange
        Organization costRoomOrg = new Organization();
        costRoomOrg.setId(1L);
        costRoomOrg.setName("Cost Room");

        User newUser = new User();
        newUser.setId(1L);
        newUser.setUid("test-uid");
        newUser.setEmail("test@example.com");
        newUser.setName("Test User");
        newUser.setRole(User.Role.SUPER_ADMIN);

        when(userRepository.count()).thenReturn(5L); // Not first user
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        when(organizationService.getOrCreateCostRoomOrganization()).thenReturn(costRoomOrg);
        when(userRepository.save(any(User.class))).thenReturn(newUser);

        // Act
        User result = userService.saveUserToDB("test-uid", "test@example.com", "Test User", User.Role.SUPER_ADMIN);

        // Assert
        assertNotNull(result);
        assertEquals(User.Role.SUPER_ADMIN, result.getRole());
        assertNotNull(result.getOrganization());
        assertEquals("Cost Room", result.getOrganization().getName());
        verify(organizationService, times(1)).getOrCreateCostRoomOrganization();
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testUpdateUserRole_ToSuperAdmin() {
        // Arrange
        Organization costRoomOrg = new Organization();
        costRoomOrg.setId(1L);
        costRoomOrg.setName("Cost Room");

        User existingUser = new User();
        existingUser.setId(1L);
        existingUser.setUid("test-uid");
        existingUser.setEmail("test@example.com");
        existingUser.setName("Test User");
        existingUser.setRole(User.Role.REQUESTER);

        User updatedUser = new User();
        updatedUser.setId(1L);
        updatedUser.setUid("test-uid");
        updatedUser.setEmail("test@example.com");
        updatedUser.setName("Test User");
        updatedUser.setRole(User.Role.SUPER_ADMIN);
        updatedUser.setOrganization(costRoomOrg);

        when(userRepository.findByUid("test-uid")).thenReturn(Optional.of(existingUser));
        when(organizationService.getOrCreateCostRoomOrganization()).thenReturn(costRoomOrg);
        when(userRepository.save(any(User.class))).thenReturn(updatedUser);

        // Act
        User result = userService.updateUserRole("test-uid", User.Role.SUPER_ADMIN);

        // Assert
        assertNotNull(result);
        assertEquals(User.Role.SUPER_ADMIN, result.getRole());
        assertNotNull(result.getOrganization());
        assertEquals("Cost Room", result.getOrganization().getName());
        verify(organizationService, times(1)).getOrCreateCostRoomOrganization();
        verify(userRepository, times(1)).save(any(User.class));
    }
}