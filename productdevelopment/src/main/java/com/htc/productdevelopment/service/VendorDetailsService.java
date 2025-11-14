package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.VendorDetails;
import com.htc.productdevelopment.repository.VendorDetailsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VendorDetailsService {

    @Autowired
    private VendorDetailsRepository vendorDetailsRepository;

    // Fetch distinct vendor names for dropdown
    public List<String> getAllVendors() {
        return vendorDetailsRepository.findDistinctVendorNames();
    }

    // Fetch all products for a vendor
    public List<VendorDetails> getProductsByVendor(String vendorName) {
        return vendorDetailsRepository.findByNameOfVendor(vendorName);
    }
}
