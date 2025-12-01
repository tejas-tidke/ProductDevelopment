package com.htc.productdevelopment.service;

import com.htc.productdevelopment.dto.VendorDetailsDTO;
import com.htc.productdevelopment.model.VendorDetails;
import com.htc.productdevelopment.repository.VendorDetailsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VendorDetailsService {

    @Autowired
    private VendorDetailsRepository vendorDetailsRepository;
    

    // Fetch distinct vendor names for dropdown
    public List<String> getAllVendors() {
        return vendorDetailsRepository.findDistinctVendorNames();
    }

    // Fetch all products for a vendor
    public List<VendorDetailsDTO> getProductsByVendor(String vendorName) {
        List<VendorDetails> vendorDetailsList = vendorDetailsRepository.findByNameOfVendor(vendorName);
        return vendorDetailsList.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    // Fetch product type for a specific vendor and product
    public String getProductType(String vendorName, String productName) {
        return vendorDetailsRepository.findProductTypeByVendorAndProduct(vendorName, productName);
    }
    
    // Fetch all products of a specific type for a vendor
    public List<VendorDetailsDTO> getProductsByVendorAndType(String vendorName, String productType) {
        List<VendorDetails> vendorDetailsList = vendorDetailsRepository.findByNameOfVendorAndProductType(vendorName, productType);
        return vendorDetailsList.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    // Convert VendorDetails entity to VendorDetailsDTO
    private VendorDetailsDTO convertToDTO(VendorDetails vendorDetails) {
        VendorDetailsDTO dto = new VendorDetailsDTO();
        dto.setId(vendorDetails.getId());
        dto.setNameOfVendor(vendorDetails.getNameOfVendor());
        dto.setProductName(vendorDetails.getProductName());
        dto.setProductLink(vendorDetails.getProductLink());
        dto.setProductType(vendorDetails.getProductType());
        return dto;
    }
    
    public VendorDetailsDTO createVendor(VendorDetailsDTO dto) {
        VendorDetails entity = convertToEntity(dto);
        VendorDetails saved = vendorDetailsRepository.save(entity);
        return convertToDTO(saved);
    }
    
    private VendorDetails convertToEntity(VendorDetailsDTO dto) {
		VendorDetails entity = new VendorDetails();
		entity.setId(dto.getId()); // usually null when creating
		entity.setNameOfVendor(dto.getNameOfVendor());
		entity.setProductName(dto.getProductName());
		entity.setProductLink(dto.getProductLink());
		entity.setProductType(dto.getProductType());
		return entity;
	}
    
	public boolean deleteVendorById(Long id) {
        if (!vendorDetailsRepository.existsById(id)) {
            return false;
        }
        vendorDetailsRepository.deleteById(id);
        return true;
    }

}