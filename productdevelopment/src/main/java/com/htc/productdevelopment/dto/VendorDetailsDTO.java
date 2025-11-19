package com.htc.productdevelopment.dto;

import lombok.Data;

@Data
public class VendorDetailsDTO {
    private Long id;
    private String nameOfVendor;
    private String productName;
    private String productLink;
    private String productType; // New field to indicate if product is license-based or usage-based
}