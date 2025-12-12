package com.htc.productdevelopment.dto;

import lombok.Data;

@Data
public class VendorProfileDTO {
    private Long vendorId;
    private String vendorName;
    private String vendorOwner;
    private String department;
    private Long productId;
    private String productName;
    private String productType;
}