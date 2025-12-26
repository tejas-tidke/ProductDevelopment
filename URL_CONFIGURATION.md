# URL Configuration Guide

This document explains how URLs are configured in the CostRoom application to prevent CORS issues and ensure proper communication between frontend and backend.

## Problem Statement

The application was experiencing CORS (Cross-Origin Resource Sharing) errors because:

1. Frontend was making requests to hardcoded URLs like `http://192.168.1.115:8080` and `http://localhost:8080`
2. Backend CORS configuration was limited to specific origins
3. There was no centralized URL management, leading to inconsistencies

## Solution Implemented

### 1. Frontend Configuration (`apiConfig.ts`)

Created a centralized configuration file at:
`ProductDevelopment/free-react-tailwind-admin-dashboard-main/src/config/apiConfig.ts`

Key features:
- Dynamic URL detection based on current environment
- Support for multiple development environments (localhost, IP addresses)
- Centralized API endpoint definitions
- Environment variable override capability

### 2. Backend Configuration (`UrlConfig.java`)

Created a centralized configuration class at:
`ProductDevelopment/productdevelopment/src/main/java/com/htc/productdevelopment/config/UrlConfig.java`

Key features:
- Centralized management of all URLs
- Dynamic CORS configuration using application properties
- Support for multiple frontend origins
- Easy extensibility for new environments

### 3. Updated Web Configuration

Modified `WebConfig.java` to use the new `UrlConfig` for dynamic CORS configuration.

## How to Use

### Frontend Usage

1. Import the configuration:
```typescript
import { getApiUrl, API_ENDPOINTS } from '../config/apiConfig';
```

2. Use the helper functions:
```typescript
// Get base API URL
const baseUrl = getApiUrl('');

// Get specific endpoint
const usersEndpoint = getApiUrl(API_ENDPOINTS.USERS.BASE);

// Use parameterized endpoints
const userEndpoint = getApiUrl(API_ENDPOINTS.USERS.BY_ID(userId));
```

### Backend Usage

The backend automatically reads URLs from `application.properties`:
```properties
app.frontend.url=http://localhost:5173
app.frontend.ip.url=http://192.168.1.115:5173
```

## Adding New Environments

### Frontend

1. Add new URLs to `API_BASE_URLS` and `FRONTEND_URLS` in `apiConfig.ts`
2. Update the detection logic in `getApiBaseUrl()` and `getFrontendUrl()` if needed

### Backend

1. Add new URLs to `FrontendUrls` class in `UrlConfig.java`
2. Update `application.properties` with new frontend URLs
3. The CORS configuration will automatically include the new URLs

## Environment Variables

### Frontend

- `VITE_API_URL`: Override the API base URL
- `VITE_FRONTEND_URL`: Override the frontend URL

### Backend

- `app.frontend.url`: Primary frontend URL
- `app.frontend.ip.url`: Alternative frontend URL (IP-based)

## Troubleshooting

If you still encounter CORS issues:

1. Check that the frontend URL is correctly configured in `application.properties`
2. Verify that the requesting origin is included in the allowed origins
3. Ensure that Nginx (if used) is properly configured to forward requests
4. Check browser developer tools for specific CORS error messages

## Best Practices

1. Always use the centralized configuration instead of hardcoded URLs
2. Test in all supported environments (localhost, IP addresses)
3. Keep frontend and backend URL configurations synchronized
4. Document any new URLs or environments added