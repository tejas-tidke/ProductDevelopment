package com.htc.productdevelopment.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;


/**
 * Configuration class for Firebase integration.
 * Loads credentials from environment variable (Base64 encoded JSON)
 * instead of a local file.
 */
@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    // Read Base64 encoded credentials from environment (.env)
    @Value("${FIREBASE_CREDENTIALS_B64:}")
    private String firebaseCredentialsB64;

    @PostConstruct
    public void initializeFirebase() {
        logger.info("Initializing Firebase configuration...");

        try {
            // Check if Firebase app already exists
            if (!FirebaseApp.getApps().isEmpty()) {
                logger.info("Firebase app already initialized.");
                return;
            }

            if (firebaseCredentialsB64 == null || firebaseCredentialsB64.isEmpty()) {
                logger.error("Firebase credentials not found! Please set FIREBASE_CREDENTIALS_B64 in your .env file.");
                return;
            }

            // Decode Base64 -> JSON string
            byte[] decodedBytes = Base64.getDecoder().decode(firebaseCredentialsB64);
            String jsonCredentials = new String(decodedBytes, StandardCharsets.UTF_8);

            // Create credentials from JSON string
            GoogleCredentials credentials = GoogleCredentials.fromStream(
                    new ByteArrayInputStream(jsonCredentials.getBytes(StandardCharsets.UTF_8))
            );

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();

            FirebaseApp.initializeApp(options);
            logger.info("✅ Firebase initialized successfully from environment variable.");

        } catch (Exception e) {
            logger.error("❌ Failed to initialize Firebase: {}", e.getMessage(), e);
        }
    }
}
