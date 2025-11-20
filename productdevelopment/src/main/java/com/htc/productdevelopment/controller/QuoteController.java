package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.model.Quote;
import com.htc.productdevelopment.service.QuoteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quotes")
@CrossOrigin(origins = "http://localhost:5173") // adjust port/origin as needed
public class QuoteController {

    private final QuoteService quoteService;

    public QuoteController(QuoteService quoteService) {
        this.quoteService = quoteService;
    }

    @PostMapping
    public ResponseEntity<Quote> createQuote(@RequestBody Quote quote) {
        // TODO: replace with actual logged-in user
        String currentUser = "system";

        Quote created = quoteService.createQuote(quote, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
