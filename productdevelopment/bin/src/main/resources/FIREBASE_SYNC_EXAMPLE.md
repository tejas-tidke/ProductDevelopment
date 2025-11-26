# Firebase to Database Synchronization Example

This document shows how your frontend should call the backend endpoints to sync Firebase user data to your database.

## After Firebase Sign Up

```javascript
// After creating a new user with Firebase
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
const user = userCredential.user;

// Sync user data to your backend database
try {
  const response = await fetch('http://localhost:8080/api/auth/sync-firebase-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: user.displayName || ''
    })
  });
  
  const userData = await response.json();
  console.log('User synced to database:', userData);
} catch (error) {
  console.error('Error syncing user to database:', error);
}
```

## After Firebase Sign In

```javascript
// After signing in with Firebase
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const user = userCredential.user;

// Sync user data to your backend database
try {
  const response = await fetch('http://localhost:8080/api/auth/sync-firebase-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uid: user.uid
    })
  });
  
  const userData = await response.json();
  console.log('User synced to database:', userData);
  
  // Check user role to determine which components to show
  const roleResponse = await fetch(`http://localhost:8080/api/auth/role/${user.uid}`);
  const roleData = await roleResponse.json();
  console.log('User role:', roleData.role);
} catch (error) {
  console.error('Error syncing user to database:', error);
}
```

## Using Firebase ID Token

```javascript
// After Firebase authentication, you can also use ID tokens
const user = auth.currentUser;
if (user) {
  const idToken = await user.getIdToken();
  
  // Sync using ID token
  try {
    const response = await fetch('http://localhost:8080/api/auth/sync-firebase-user-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: idToken
      })
    });
    
    const userData = await response.json();
    console.log('User synced to database using token:', userData);
  } catch (error) {
    console.error('Error syncing user to database:', error);
  }
}
```