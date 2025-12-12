package com.htc.productdevelopment.dto;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class VendorDetailsDTO {
    private Long id;
    private String nameOfVendor;
    private String productName;
    private String productLink;
    private String productType; // New field to indicate if product is license-based or usage-based
    
    @JsonProperty("owner")
    private String vendorOwner; // New field for vendor owner
    
    private String department; // New field for department
}