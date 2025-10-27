# Firebase Authentication Troubleshooting Guide

This guide helps diagnose and resolve common issues with Firebase authentication in the TailAdmin React dashboard.

## Common Issues and Solutions

### 1. 400 Error on Sign In

**Symptoms**: 
- Console shows "Failed to load resource: the server responded with a status of 400 ()"
- Sign in form shows generic "Failed to sign in" error

**Possible Causes**:
1. Incorrect Firebase project configuration
2. Email/password authentication not enabled in Firebase Console
3. Invalid credentials (wrong email/password)
4. Network connectivity issues

**Solutions**:
1. Verify all environment variables in `.env` file match your Firebase project settings
2. Enable Email/Password sign-in method in Firebase Console:
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable "Email/Password" provider
3. Double-check email and password credentials
4. Check network connectivity and firewall settings

### 2. Invalid Credentials Error

**Symptoms**:
- Specific error message: "Invalid email or password"
- User exists in Firebase but can't sign in

**Solutions**:
1. Verify the user account exists in Firebase Authentication dashboard
2. Reset password using Firebase Console if needed
3. Check for typos in email/password
4. Ensure password meets minimum requirements (6+ characters)

### 3. Account Disabled Error

**Symptoms**:
- Error message: "This account has been disabled"

**Solutions**:
1. Check Firebase Authentication dashboard for user status
2. Re-enable the account in Firebase Console if it was disabled
3. Contact Firebase support if account was disabled automatically

### 4. User Not Found Error

**Symptoms**:
- Error message: "No account found with this email"

**Solutions**:
1. Verify the email address is correctly spelled
2. Check if the user account exists in Firebase Authentication
3. User may need to sign up first before signing in

### 5. Weak Password Error

**Symptoms**:
- Error during registration: "Password should be at least 6 characters"

**Solutions**:
1. Ensure password is at least 6 characters long
2. Use a stronger password with mixed characters

### 6. Email Already In Use Error

**Symptoms**:
- Error during registration: "An account already exists with this email"

**Solutions**:
1. Use a different email address
2. Sign in with existing credentials instead of registering
3. Use password reset if credentials are forgotten

## Debugging Steps

### 1. Check Browser Console
- Open Developer Tools (F12)
- Look for any error messages in the Console tab
- Check Network tab for failed requests to Firebase APIs

### 2. Verify Environment Variables
- Ensure all Firebase configuration variables are correctly set in `.env`:
  ```
  VITE_FIREBASE_API_KEY=your_api_key
  VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
  VITE_FIREBASE_PROJECT_ID=your_project_id
  VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
  VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
  VITE_FIREBASE_APP_ID=your_app_id
  ```

### 3. Test Firebase Configuration
- Add temporary logging in `src/firebase.ts`:
  ```javascript
  // Add after initializing app
  console.log("Firebase app initialized:", app.name);
  console.log("Firebase auth initialized:", auth);
  ```

### 4. Check Firebase Project Settings
- Go to Firebase Console → Project Settings
- Verify all configuration values match your `.env` file
- Ensure your domain (localhost:5173) is added to authorized domains

### 5. Enable Detailed Logging
- Temporarily add more logging in authentication hooks:
  ```javascript
  console.log("Attempting sign in with:", email);
  console.log("Sign in result:", userCredential);
  ```

## Testing Credentials

To test if the authentication system is working:

1. **Create a Test User**:
   - Use Firebase Console to manually create a test user
   - Or use the sign up form with a new email/password

2. **Verify User Creation**:
   - Check Firebase Authentication → Users tab
   - Confirm the user appears in the list

3. **Test Sign In**:
   - Use the sign in form with the test credentials
   - Verify successful authentication and redirect to dashboard

## Firebase Console Setup

Ensure your Firebase project is properly configured:

1. **Enable Authentication**:
   - Go to Firebase Console → Authentication
   - Click "Get Started"
   - Enable "Email/Password" sign-in provider

2. **Add Authorized Domains**:
   - In Firebase Console → Authentication → Settings
   - Add "localhost" to authorized domains

3. **Check API Key Restrictions**:
   - In Google Cloud Console → APIs & Services → Credentials
   - Ensure Firebase API key doesn't have IP restrictions for localhost

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Error Codes](https://firebase.google.com/docs/reference/js/auth)