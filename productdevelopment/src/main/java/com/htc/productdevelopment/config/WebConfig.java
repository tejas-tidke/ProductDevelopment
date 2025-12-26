package com.htc.productdevelopment.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration class for web-related settings.
 * This class configures CORS (Cross-Origin Resource Sharing) for the application.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Autowired
    private UrlConfig urlConfig;
    
    /**
     * Configures CORS mappings for API endpoints.
     * Allows cross-origin requests from the frontend application.
     * Uses centralized URL configuration to prevent CORS issues.
     * 
     * @param registry the CORS registry to configure
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(urlConfig.getAllowedOrigins())
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}