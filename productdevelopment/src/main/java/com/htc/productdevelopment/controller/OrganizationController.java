package com.htc.productdevelopment.controller;
 
import com.htc.productdevelopment.model.Organization;

import com.htc.productdevelopment.service.OrganizationService;

import com.htc.productdevelopment.service.UserService;
 
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import org.springframework.beans.factory.annotation.Autowired;
 
import java.util.List;

import java.util.Map;

import java.util.Optional;
 
import org.slf4j.Logger;

import org.slf4j.LoggerFactory;
 
@RestController

@RequestMapping("/api/organizations")

@CrossOrigin(origins = "http://localhost:5173")

public class OrganizationController {
 
    private static final Logger logger = LoggerFactory.getLogger(OrganizationController.class);
 
    private final OrganizationService organizationService;

    private final UserService userService;
 
    @Autowired

    public OrganizationController(OrganizationService organizationService, UserService userService) {

        this.organizationService = organizationService;

        this.userService = userService;

    }
 
    // -------------------------------------------------------------------------

    // Get all organizations

    // -------------------------------------------------------------------------

    @GetMapping

    public ResponseEntity<?> getAllOrganizations() {

        try {

            List<Organization> organizations = organizationService.getAllOrganizations();

            return ResponseEntity.ok(organizations);

        } catch (Exception e) {

            logger.error("Error fetching organizations", e);

            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));

        }

    }
 
    // -------------------------------------------------------------------------

    // Get organization by ID

    // -------------------------------------------------------------------------

    @GetMapping("/{id}")

    public ResponseEntity<?> getOrganizationById(@PathVariable Long id) {

        try {

            Optional<Organization> organization = organizationService.getOrganizationById(id);

            if (organization.isPresent()) {

                return ResponseEntity.ok(organization.get());

            } else {

                return ResponseEntity.badRequest().body(Map.of("error", "Organization not found"));

            }

        } catch (Exception e) {

            logger.error("Error fetching organization with ID: " + id, e);

            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));

        }

    }
 
    // -------------------------------------------------------------------------

    // Create a new organization

    // -------------------------------------------------------------------------

    @PostMapping

    public ResponseEntity<?> createOrganization(@RequestBody Map<String, Object> requestData) {

        try {

            String name = (String) requestData.get("name");

            Long parentId = requestData.get("parentId") != null ? Long.parseLong(requestData.get("parentId").toString()) : null;
 
            Organization organization = organizationService.createOrganization(name, parentId);

            return ResponseEntity.ok(organization);

        } catch (Exception e) {

            logger.error("Error creating organization", e);

            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));

        }

    }
 
    // -------------------------------------------------------------------------

    // Update an organization

    // -------------------------------------------------------------------------

    @PutMapping("/{id}")

    public ResponseEntity<?> updateOrganization(@PathVariable Long id, @RequestBody Map<String, Object> requestData) {

        try {

            String name = (String) requestData.get("name");

            Long parentId = requestData.get("parentId") != null ? Long.parseLong(requestData.get("parentId").toString()) : null;
 
            Organization organization = organizationService.updateOrganization(id, name, parentId);

            return ResponseEntity.ok(organization);

        } catch (Exception e) {

            logger.error("Error updating organization with ID: " + id, e);

            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));

        }

    }
 
    // -------------------------------------------------------------------------

    // Delete an organization

    // -------------------------------------------------------------------------

    @DeleteMapping("/{id}")

    public ResponseEntity<?> deleteOrganization(@PathVariable Long id) {

        try {

            organizationService.deleteOrganization(id);

            return ResponseEntity.ok(Map.of("message", "Organization deleted successfully"));

        } catch (Exception e) {

            logger.error("Error deleting organization with ID: " + id, e);

            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));

        }

    }
 
    // -------------------------------------------------------------------------

    // Get child organizations

    // -------------------------------------------------------------------------

    @GetMapping("/{id}/children")

    public ResponseEntity<?> getChildOrganizations(@PathVariable Long id) {

        try {

            List<Organization> children = organizationService.getChildOrganizations(id);

            return ResponseEntity.ok(children);

        } catch (Exception e) {

            logger.error("Error fetching child organizations for parent ID: " + id, e);

            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));

        }

    }

}
 