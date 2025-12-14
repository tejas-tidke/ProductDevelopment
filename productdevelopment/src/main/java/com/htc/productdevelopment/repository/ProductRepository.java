package com.htc.productdevelopment.repository;

import com.htc.productdevelopment.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByProductType(String productType);
    
    // Add method to find product by name and type
    List<Product> findByProductNameAndProductType(String productName, String productType);
}