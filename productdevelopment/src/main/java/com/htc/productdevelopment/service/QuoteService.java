package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.Quote;
import com.htc.productdevelopment.repository.QuoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuoteService {

    private final QuoteRepository quoteRepository;

    public QuoteService(QuoteRepository quoteRepository) {
        this.quoteRepository = quoteRepository;
    }

    @Transactional
    public Quote createQuote(Quote quote, String currentUser) {
        quote.setCreatedBy(currentUser);
        return quoteRepository.save(quote);
    }
}
