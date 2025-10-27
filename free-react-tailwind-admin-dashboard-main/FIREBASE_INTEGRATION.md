# Firebase Integration Guide

This document explains how Firebase has been integrated into the TailAdmin React dashboard.

## Firebase Setup

The dashboard has been configured with Firebase authentication and integration. Here's what has been implemented:

### 1. Firebase Configuration

- Firebase SDK has been installed and configured
- Environment variables are used for Firebase configuration (see `.env` file)
- Firebase authentication is set up with email/password sign-in method

### 2. Authentication Flow

- **Sign In**: Users can sign in with email and password
- **Sign Up**: New users can create an account
- **Sign Out**: Users can sign out from the application
- **Protected Routes**: Certain pages are protected and require authentication

### 3. Key Components

1. **Auth Context**: Manages the authentication state across the application
2. **Protected Routes**: HOC that protects routes from unauthenticated access
3. **Custom Hooks**:
   - `useFirebaseAuth`: Handles sign-in functionality
   - `useRegister`: Handles user registration
   - `useSignOut`: Handles user sign-out
4. **API Service**: Communicates with the backend API using Firebase authentication tokens

### 4. Environment Variables

The following environment variables are required in the `.env` file:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:8080
```

### 5. File Structure

The Firebase integration files are located in:

- `src/firebase.ts`: Firebase initialization
- `src/context/AuthContext.tsx`: Authentication context
- `src/hooks/useFirebaseAuth.ts`: Sign-in hook
- `src/hooks/useRegister.ts`: Registration hook
- `src/hooks/useSignOut.ts`: Sign-out hook
- `src/components/auth/ProtectedRoute.tsx`: Protected route component
- `src/components/auth/SignInForm.tsx`: Sign-in form with Firebase integration
- `src/components/auth/SignUpForm.tsx`: Sign-up form with Firebase integration
- `src/components/header/UserDropdown.tsx`: User dropdown with sign-out functionality
- `src/services/api.ts`: API service with Firebase authentication

## Usage

1. **Sign In**: Navigate to `/signin` and enter your credentials
2. **Sign Up**: Navigate to `/signup` to create a new account
3. **Protected Pages**: All dashboard pages are protected and require authentication
4. **Sign Out**: Click the "Sign out" button in the user dropdown menu

## Backend Integration

The dashboard is designed to work with a backend API. The API service automatically includes the Firebase ID token in the Authorization header for authenticated requests.

## Troubleshooting

If you encounter issues with Firebase authentication:

1. Verify that all environment variables are correctly set in the `.env` file
2. Check the browser console for any error messages
3. Ensure that the Firebase project has email/password authentication enabled