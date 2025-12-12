package com.htc.productdevelopment.repository;

import com.htc.productdevelopment.model.VendorProfile;
import com.htc.productdevelopment.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorProfileRepository extends JpaRepository<VendorProfile, Long> {
    // Find all vendor profiles by product
    List<VendorProfile> findByProduct(Product product);
    
    // Find all vendor profiles by vendor name
    List<VendorProfile> findByVendorName(String vendorName);
    
    // Get distinct vendor names for dropdown
    @Query("SELECT DISTINCT vp.vendorName FROM VendorProfile vp ORDER BY vp.vendorName ASC")
    List<String> findDistinctVendorNames();
    
    // Find vendor profiles by vendor name and product type
    @Query("SELECT vp FROM VendorProfile vp WHERE vp.vendorName = ?1 AND vp.product.productType = ?2")
    List<VendorProfile> findByVendorNameAndProductType(String vendorName, String productType);
}