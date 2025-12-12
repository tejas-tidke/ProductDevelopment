package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.model.Product;
import com.htc.productdevelopment.dto.ProductDTO;
import com.htc.productdevelopment.service.VendorProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private VendorProfileService vendorProfileService;

    // Fetch all products
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        try {
            // Note: We're using VendorProfileService here as it has the ProductRepository autowired
            // In a production environment, you might want to create a dedicated ProductService
            List<Product> products = vendorProfileService.getAllProducts();
            return new ResponseEntity<>(products, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    // Fetch all products as DTOs
    @GetMapping("/dtos")
    public ResponseEntity<List<ProductDTO>> getAllProductDTOs() {
        try {
            List<ProductDTO> productDTOs = vendorProfileService.getAllProductDTOs();
            return new ResponseEntity<>(productDTOs, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }
}