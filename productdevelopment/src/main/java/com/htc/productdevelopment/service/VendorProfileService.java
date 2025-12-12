package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.VendorProfile;
import com.htc.productdevelopment.model.Product;
import com.htc.productdevelopment.dto.VendorProfileDTO;
import com.htc.productdevelopment.dto.ProductDTO;
import com.htc.productdevelopment.repository.VendorProfileRepository;
import com.htc.productdevelopment.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VendorProfileService {

    @Autowired
    private VendorProfileRepository vendorProfileRepository;
    
    @Autowired
    private ProductRepository productRepository;

    // Fetch distinct vendor names for dropdown
    public List<String> getAllVendors() {
        return vendorProfileRepository.findDistinctVendorNames();
    }

    // Fetch all vendor profiles
    public List<VendorProfile> getAllVendorProfiles() {
        return vendorProfileRepository.findAll();
    }

    // Fetch all products
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // Fetch all products as DTOs
    public List<ProductDTO> getAllProductDTOs() {
        List<Product> products = productRepository.findAll();
        return products.stream().map(this::convertToProductDTO).collect(Collectors.toList());
    }

    // Fetch vendor profiles by vendor name
    public List<VendorProfile> getVendorProfilesByName(String vendorName) {
        return vendorProfileRepository.findByVendorName(vendorName);
    }

    // Fetch vendor profiles by vendor name and product type
    public List<VendorProfile> getVendorProfilesByNameAndProductType(String vendorName, String productType) {
        return vendorProfileRepository.findByVendorNameAndProductType(vendorName, productType);
    }

    // Fetch vendor profiles as DTOs by vendor name (for compatibility with existing frontend)
    public List<VendorProfileDTO> getVendorProfileDTOsByName(String vendorName) {
        List<VendorProfile> vendorProfiles = vendorProfileRepository.findByVendorName(vendorName);
        return vendorProfiles.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    // Create a new vendor profile
    public VendorProfile createVendorProfile(VendorProfile vendorProfile) {
        return vendorProfileRepository.save(vendorProfile);
    }

    // Create a new vendor profile from DTO
    public VendorProfile createVendorProfileFromDTO(VendorProfileDTO vendorProfileDTO) {
        VendorProfile vendorProfile = new VendorProfile();
        vendorProfile.setVendorName(vendorProfileDTO.getVendorName());
        vendorProfile.setVendorOwner(vendorProfileDTO.getVendorOwner());
        vendorProfile.setDepartment(vendorProfileDTO.getDepartment());
        
        // Set product if productId is provided
        if (vendorProfileDTO.getProductId() != null) {
            Product product = productRepository.findById(vendorProfileDTO.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + vendorProfileDTO.getProductId()));
            vendorProfile.setProduct(product);
        }
        
        return vendorProfileRepository.save(vendorProfile);
    }

    // Update an existing vendor profile
    public VendorProfile updateVendorProfile(Long vendorId, VendorProfile vendorProfileDetails) {
        VendorProfile vendorProfile = vendorProfileRepository.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("VendorProfile not found with id: " + vendorId));
        
        vendorProfile.setVendorName(vendorProfileDetails.getVendorName());
        vendorProfile.setVendorOwner(vendorProfileDetails.getVendorOwner());
        vendorProfile.setDepartment(vendorProfileDetails.getDepartment());
        vendorProfile.setProduct(vendorProfileDetails.getProduct());
        
        return vendorProfileRepository.save(vendorProfile);
    }

    // Update an existing vendor profile from DTO
    public VendorProfile updateVendorProfileFromDTO(Long vendorId, VendorProfileDTO vendorProfileDTO) {
        VendorProfile vendorProfile = vendorProfileRepository.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("VendorProfile not found with id: " + vendorId));
        
        vendorProfile.setVendorName(vendorProfileDTO.getVendorName());
        vendorProfile.setVendorOwner(vendorProfileDTO.getVendorOwner());
        vendorProfile.setDepartment(vendorProfileDTO.getDepartment());
        
        // Set product if productId is provided
        if (vendorProfileDTO.getProductId() != null) {
            Product product = productRepository.findById(vendorProfileDTO.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found with id: " + vendorProfileDTO.getProductId()));
            vendorProfile.setProduct(product);
        }
        
        return vendorProfileRepository.save(vendorProfile);
    }

    // Delete a vendor profile
    public void deleteVendorProfile(Long vendorId) {
        VendorProfile vendorProfile = vendorProfileRepository.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("VendorProfile not found with id: " + vendorId));
        vendorProfileRepository.delete(vendorProfile);
    }

    // Convert VendorProfile entity to VendorProfileDTO
    private VendorProfileDTO convertToDTO(VendorProfile vendorProfile) {
        VendorProfileDTO dto = new VendorProfileDTO();
        dto.setVendorId(vendorProfile.getVendorId());
        dto.setVendorName(vendorProfile.getVendorName());
        dto.setVendorOwner(vendorProfile.getVendorOwner());
        dto.setDepartment(vendorProfile.getDepartment());
        
        if (vendorProfile.getProduct() != null) {
            dto.setProductId(vendorProfile.getProduct().getProductId());
            dto.setProductName(vendorProfile.getProduct().getProductName());
            dto.setProductType(vendorProfile.getProduct().getProductType());
        }
        
        return dto;
    }

    // Convert Product entity to ProductDTO
    private ProductDTO convertToProductDTO(Product product) {
        ProductDTO dto = new ProductDTO();
        dto.setProductId(product.getProductId());
        dto.setProductName(product.getProductName());
        dto.setProductType(product.getProductType());
        return dto;
    }
}