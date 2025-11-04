package com.htc.productdevelopment.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

/**
 * Configuration class for Firebase integration.
 * This class initializes the Firebase Admin SDK using the service account credentials.
 */
@Configuration
public class FirebaseConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);
    
    /**
     * Initializes the Firebase configuration after the bean is constructed.
     * Loads the service account key from the classpath and initializes the Firebase app.
     */
    @PostConstruct
    public void initializeFirebase() {
        logger.info("Initializing Firebase configuration");
        
        try {
            // This will look for the service account key file in the resources folder
            ClassPathResource serviceAccount = new ClassPathResource("firebase-service-account.json");
            
            logger.info("Looking for Firebase service account file: firebase-service-account.json");
            logger.info("Service account file exists: {}", serviceAccount.exists());
            
            if (serviceAccount.exists()) {
                logger.info("Firebase service account file found, initializing Firebase app");
                
                FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount.getInputStream()))
                    .build();
                    
                logger.info("Firebase options created successfully");
                
                if (FirebaseApp.getApps().isEmpty()) {
                    FirebaseApp.initializeApp(options);
                    logger.info("Firebase app initialized successfully");
                } else {
                    logger.info("Firebase app already initialized");
                }
            } else {
                logger.warn("Firebase service account file not found. Skipping Firebase initialization.");
                logger.warn("Make sure firebase-service-account.json is in src/main/resources/");
            }
        } catch (IOException e) {
            logger.error("Error initializing Firebase: {}", e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error during Firebase initialization: {}", e.getMessage(), e);
        }
    }
}