package com.htc.productdevelopment.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Centralized URL configuration for the backend application.
 * This class manages all URL-related settings to prevent CORS and routing issues.
 */
@Component
public class UrlConfig {

    /**
     * Frontend URLs - used for CORS configuration and redirects
     */
    public static class FrontendUrls {
        public static final String LOCALHOST = "http://localhost:5173";
        public static final String LOCALHOST_IP = "http://127.0.0.1:5173";
        public static final String NETWORK_IP = "http://192.168.1.115:5173";
        
        // Add more frontend URLs as needed for different environments
        public static final String[] ALL_ALLOWED_ORIGINS = {
            LOCALHOST,
            LOCALHOST_IP,
            NETWORK_IP
        };
    }

    /**
     * Backend URLs - used for internal routing and API documentation
     */
    public static class BackendUrls {
        public static final String LOCALHOST = "http://localhost:8080";
        public static final String LOCALHOST_IP = "http://127.0.0.1:8080";
        public static final String NETWORK_IP = "http://192.168.1.115:8080";
    }

    /**
     * API Path Prefixes
     */
    public static class ApiPaths {
        public static final String API_PREFIX = "/api";
        public static final String AUTH_PATH = API_PREFIX + "/auth";
        public static final String USERS_PATH = API_PREFIX + "/users";
        public static final String ORGANIZATIONS_PATH = API_PREFIX + "/organizations";
        public static final String INVITATIONS_PATH = API_PREFIX + "/invitations";
        public static final String NOTIFICATIONS_PATH = API_PREFIX + "/notifications";
        public static final String JIRA_PATH = API_PREFIX + "/jira";
        public static final String JIRA_CONTRACTS_PATH = JIRA_PATH + "/contracts";
        public static final String JIRA_PROPOSALS_PATH = JIRA_PATH + "/proposals";
        public static final String JIRA_ISSUES_PATH = JIRA_PATH + "/issues";
        public static final String JIRA_ATTACHMENT_PATH = JIRA_PATH + "/attachment";
    }

    /**
     * Application properties that can be configured in application.properties
     */
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.frontend.ip.url:http://192.168.1.115:5173}")
    private String frontendIpUrl;

    @Value("${server.port:8080}")
    private String serverPort;

    /**
     * Get the primary frontend URL
     * @return The configured frontend URL
     */
    public String getFrontendUrl() {
        return frontendUrl;
    }

    /**
     * Get the frontend IP URL
     * @return The configured frontend IP URL
     */
    public String getFrontendIpUrl() {
        return frontendIpUrl;
    }

    /**
     * Get the backend server URL based on the server port
     * @return The backend server URL
     */
    public String getBackendUrl() {
        return "http://localhost:" + serverPort;
    }

    /**
     * Get all allowed frontend origins for CORS
     * @return Array of allowed origins
     */
    public String[] getAllowedOrigins() {
        return new String[] {
            FrontendUrls.LOCALHOST,
            FrontendUrls.LOCALHOST_IP,
            FrontendUrls.NETWORK_IP,
            frontendUrl,
            frontendIpUrl
        };
    }

    /**
     * Check if a given origin is allowed
     * @param origin The origin to check
     * @return true if the origin is allowed, false otherwise
     */
    public boolean isAllowedOrigin(String origin) {
        if (origin == null) return false;
        
        for (String allowedOrigin : getAllowedOrigins()) {
            if (origin.equals(allowedOrigin)) {
                return true;
            }
        }
        return false;
    }
}