package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.model.VendorProfile;
import com.htc.productdevelopment.dto.VendorProfileDTO;
import com.htc.productdevelopment.service.VendorProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendor-profiles")
public class VendorProfileController {

    @Autowired
    private VendorProfileService vendorProfileService;

    // Fetch all vendors for dropdown
    @GetMapping("/vendors")
    public ResponseEntity<?> getAllVendors() {
        try {
            return ResponseEntity.ok(vendorProfileService.getAllVendors());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch vendors: " + e.getMessage()));
        }
    }

    // Fetch all vendor profiles
    @GetMapping
    public ResponseEntity<List<VendorProfile>> getAllVendorProfiles() {
        List<VendorProfile> vendorProfiles = vendorProfileService.getAllVendorProfiles();
        return new ResponseEntity<>(vendorProfiles, HttpStatus.OK);
    }

    // Fetch vendor profiles by vendor name
    @GetMapping("/{vendorName}")
    public ResponseEntity<List<VendorProfile>> getVendorProfilesByName(@PathVariable String vendorName) {
        List<VendorProfile> vendorProfiles = vendorProfileService.getVendorProfilesByName(vendorName);
        return new ResponseEntity<>(vendorProfiles, HttpStatus.OK);
    }

    // Fetch vendor profiles as DTOs by vendor name (for compatibility with existing frontend)
    @GetMapping("/{vendorName}/dtos")
    public ResponseEntity<List<VendorProfileDTO>> getVendorProfileDTOsByName(@PathVariable String vendorName) {
        List<VendorProfileDTO> vendorProfileDTOs = vendorProfileService.getVendorProfileDTOsByName(vendorName);
        return new ResponseEntity<>(vendorProfileDTOs, HttpStatus.OK);
    }

    // Fetch vendor profiles by vendor name and product type
    @GetMapping("/{vendorName}/type/{productType}")
    public ResponseEntity<List<VendorProfile>> getVendorProfilesByNameAndProductType(
            @PathVariable String vendorName, 
            @PathVariable String productType) {
        List<VendorProfile> vendorProfiles = vendorProfileService.getVendorProfilesByNameAndProductType(vendorName, productType);
        return new ResponseEntity<>(vendorProfiles, HttpStatus.OK);
    }

    // Create a new vendor profile
    @PostMapping
    public ResponseEntity<VendorProfile> createVendorProfile(@RequestBody VendorProfile vendorProfile) {
        VendorProfile createdVendorProfile = vendorProfileService.createVendorProfile(vendorProfile);
        return new ResponseEntity<>(createdVendorProfile, HttpStatus.CREATED);
    }

    // Create a new vendor profile from DTO
    @PostMapping("/dto")
    public ResponseEntity<VendorProfile> createVendorProfileFromDTO(@RequestBody VendorProfileDTO vendorProfileDTO) {
        VendorProfile createdVendorProfile = vendorProfileService.createVendorProfileFromDTO(vendorProfileDTO);
        return new ResponseEntity<>(createdVendorProfile, HttpStatus.CREATED);
    }

    // Update an existing vendor profile
    @PutMapping("/{vendorId}")
    public ResponseEntity<VendorProfile> updateVendorProfile(
            @PathVariable Long vendorId, 
            @RequestBody VendorProfile vendorProfileDetails) {
        VendorProfile updatedVendorProfile = vendorProfileService.updateVendorProfile(vendorId, vendorProfileDetails);
        return new ResponseEntity<>(updatedVendorProfile, HttpStatus.OK);
    }

    // Update an existing vendor profile from DTO
    @PutMapping("/{vendorId}/dto")
    public ResponseEntity<VendorProfile> updateVendorProfileFromDTO(
            @PathVariable Long vendorId, 
            @RequestBody VendorProfileDTO vendorProfileDTO) {
        VendorProfile updatedVendorProfile = vendorProfileService.updateVendorProfileFromDTO(vendorId, vendorProfileDTO);
        return new ResponseEntity<>(updatedVendorProfile, HttpStatus.OK);
    }

    // Delete a vendor profile
    @DeleteMapping("/{vendorId}")
    public ResponseEntity<Void> deleteVendorProfile(@PathVariable Long vendorId) {
        vendorProfileService.deleteVendorProfile(vendorId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}