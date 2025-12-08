package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.dto.VendorDetailsDTO;
import com.htc.productdevelopment.service.VendorDetailsService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Controller class for handling vendor-related API requests
 * This controller provides endpoints for vendor management operations
 */
@RestController
@RequestMapping("/api/jira/vendors")

public class VendorController {

    // Logger for tracking controller operations
    private static final Logger logger = LoggerFactory.getLogger(VendorController.class);
    
    // Service for handling vendor operations
    private final VendorDetailsService vendorDetailsService;

    public VendorController(VendorDetailsService vendorDetailsService) {
        this.vendorDetailsService = vendorDetailsService;
    }

    // 1️⃣ Fetch all vendors for dropdown
    @GetMapping
    public ResponseEntity<?> getAllVendors() {
        try {
            logger.info("Fetching all vendors for dropdown");
            return ResponseEntity.ok(vendorDetailsService.getAllVendors());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch vendors: " + e.getMessage()));
        }
    }

    // 2️⃣ Fetch all products for a given vendor
    @GetMapping("/{vendorName}/products")
    public ResponseEntity<?> getVendorProducts(@PathVariable String vendorName) {
        try {
            logger.info("Fetching all products for vendor: {}", vendorName);
            return ResponseEntity.ok(vendorDetailsService.getProductsByVendor(vendorName));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch products: " + e.getMessage()));
        }
    }

    // 3️⃣ Fetch contract details for a given vendor
    @GetMapping("/contracts/vendor/{vendorName}")
    public ResponseEntity<?> getContractsByVendor(@PathVariable String vendorName) {
        try {
            return ResponseEntity.ok(vendorDetailsService.getContractsByVendor(vendorName));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch contract details: " + e.getMessage()));
        }
    }
    
    // 4️⃣ Fetch existing license count (for upgrade/downgrade/flat renewal logic)
    @GetMapping("/{vendorName}/licenses")
    public ResponseEntity<?> getLicenseCount(@PathVariable String vendorName,
                                           @RequestParam(required = false) String productName) {
        try {
            Integer count = vendorDetailsService.getExistingLicenseCount(vendorName, productName);
            return ResponseEntity.ok(Map.of("existingLicenseCount", count != null ? count : 0));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch license count: " + e.getMessage()));
        }
    }
    
    @PostMapping
	public ResponseEntity<VendorDetailsDTO> createVendor(@RequestBody VendorDetailsDTO dto) {
		VendorDetailsDTO created = vendorDetailsService.createVendor(dto);
		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}

	// -------------------- DELETE VENDOR PRODUCT (BY ID) --------------------
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteVendorProduct(@PathVariable Long id) {
		boolean deleted = vendorDetailsService.deleteVendorById(id);
		if (!deleted) {
			return ResponseEntity.notFound().build(); // 404 if id doesn't exist
	}
		return ResponseEntity.noContent().build(); // 204 on success
	}
}