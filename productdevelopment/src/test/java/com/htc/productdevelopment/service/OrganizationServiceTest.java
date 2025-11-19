package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.Organization;
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

class OrganizationServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @InjectMocks
    private OrganizationService organizationService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetOrCreateCostRoomOrganization_WhenExists() {
        // Arrange
        Organization existingOrg = new Organization();
        existingOrg.setId(1L);
        existingOrg.setName("Cost Room");
        
        when(organizationRepository.findByName("Cost Room")).thenReturn(Optional.of(existingOrg));

        // Act
        Organization result = organizationService.getOrCreateCostRoomOrganization();

        // Assert
        assertNotNull(result);
        assertEquals("Cost Room", result.getName());
        assertEquals(1L, result.getId());
        verify(organizationRepository, times(1)).findByName("Cost Room");
        verify(organizationRepository, never()).save(any(Organization.class));
    }

    @Test
    void testGetOrCreateCostRoomOrganization_WhenNotExists() {
        // Arrange
        Organization newOrg = new Organization();
        newOrg.setId(1L);
        newOrg.setName("Cost Room");
        
        when(organizationRepository.findByName("Cost Room")).thenReturn(Optional.empty());
        when(organizationRepository.save(any(Organization.class))).thenReturn(newOrg);

        // Act
        Organization result = organizationService.getOrCreateCostRoomOrganization();

        // Assert
        assertNotNull(result);
        assertEquals("Cost Room", result.getName());
        assertEquals(1L, result.getId());
        verify(organizationRepository, times(1)).findByName("Cost Room");
        verify(organizationRepository, times(1)).save(any(Organization.class));
    }
}