package com.htc.productdevelopment.repository;

import com.htc.productdevelopment.model.Quote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuoteRepository extends JpaRepository<Quote, Long> {
    // No contract-based methods anymore – Quote no longer has a `contract` field
}
