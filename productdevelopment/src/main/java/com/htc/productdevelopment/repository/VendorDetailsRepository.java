package com.htc.productdevelopment.repository;

import com.htc.productdevelopment.model.VendorDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VendorDetailsRepository extends JpaRepository<VendorDetails, Long> {

    // All products for a vendor
    List<VendorDetails> findByNameOfVendor(String nameOfVendor);

    // Distinct vendor names for dropdown
    @Query("SELECT DISTINCT v.nameOfVendor FROM VendorDetails v ORDER BY v.nameOfVendor ASC")
    List<String> findDistinctVendorNames();
}
