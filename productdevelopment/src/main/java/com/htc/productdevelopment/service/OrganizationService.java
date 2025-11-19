package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.Organization;
import com.htc.productdevelopment.repository.OrganizationRepository;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;
import java.util.List;

@Service
public class OrganizationService {

    private static final Logger logger = LoggerFactory.getLogger(OrganizationService.class);

    private final OrganizationRepository organizationRepository;

    public OrganizationService(OrganizationRepository organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    // -------------------------------------------------------
    // Get All Organizations
    // -------------------------------------------------------
    public List<Organization> getAllOrganizations() {
        return organizationRepository.findAll();
    }

    public Optional<Organization> getOrganizationById(Long id) {
        return organizationRepository.findById(id);
    }

    public Optional<Organization> getOrganizationByName(String name) {
        return organizationRepository.findByName(name);
    }

    public List<Organization> getChildOrganizations(Long parentId) {
        return organizationRepository.findByParentId(parentId);
    }

    // -------------------------------------------------------
    // Get or Create Cost Room Organization (for SUPER_ADMIN)
    // -------------------------------------------------------
    public Organization getOrCreateCostRoomOrganization() {
        Optional<Organization> costRoomOrg = organizationRepository.findByName("Cost Room");
        if (costRoomOrg.isPresent()) {
            return costRoomOrg.get();
        } else {
            Organization org = new Organization();
            org.setName("Cost Room");
            return organizationRepository.save(org);
        }
    }

    // -------------------------------------------------------
    // Create Organization
    // -------------------------------------------------------
    public Organization createOrganization(String name, Long parentId) {
        Organization org = new Organization();
        org.setName(name);
        
        if (parentId != null) {
            Optional<Organization> parentOrg = organizationRepository.findById(parentId);
            if (parentOrg.isPresent()) {
                org.setParent(parentOrg.get());
            }
        }
        
        return organizationRepository.save(org);
    }

    // -------------------------------------------------------
    // Update Organization
    // -------------------------------------------------------
    public Organization updateOrganization(Long id, String name, Long parentId) {
        Optional<Organization> existingOrg = organizationRepository.findById(id);
        if (existingOrg.isPresent()) {
            Organization org = existingOrg.get();
            org.setName(name);
            
            if (parentId != null) {
                Optional<Organization> parentOrg = organizationRepository.findById(parentId);
                if (parentOrg.isPresent()) {
                    org.setParent(parentOrg.get());
                }
            } else {
                org.setParent(null);
            }
            
            return organizationRepository.save(org);
        } else {
            throw new RuntimeException("Organization not found with ID: " + id);
        }
    }

    // -------------------------------------------------------
    // Delete Organization
    // -------------------------------------------------------
    public void deleteOrganization(Long id) {
        organizationRepository.deleteById(id);
    }
}