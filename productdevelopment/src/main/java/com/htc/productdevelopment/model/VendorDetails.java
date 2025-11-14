package com.htc.productdevelopment.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "vendor_details")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class VendorDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name_of_vendor")
    private String nameOfVendor;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "product_link")
    private String productLink;
}
