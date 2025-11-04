# Firebase User Synchronization

This document explains how to synchronize existing Firebase users to your MySQL database.

## How It Works

The synchronization process fetches all users from your Firebase project and adds them to your local database with the following information:
- Firebase UID
- Email address
- Display name (if available)
- Default role (USER)

## Synchronization Methods

### 1. REST API Endpoint

You can trigger synchronization by calling the REST endpoint:

```
POST /api/auth/sync-all-firebase-users
```

Example using curl:
```bash
curl -X POST http://localhost:8080/api/auth/sync-all-firebase-users
```

### 2. Utility Class

The [FirebaseUserSyncUtil](file:///d:/Product Development/productdevelopment/src/main/java/com/htc/productdevelopment/util/FirebaseUserSyncUtil.java#L12-L48) class provides a method to sync all users programmatically:

```java
@Autowired
private FirebaseUserSyncUtil firebaseUserSyncUtil;

// Call this method to sync all users
firebaseUserSyncUtil.syncAllFirebaseUsersToDatabase();
```

### 3. Automatic Sync on Startup

To automatically sync all users when the application starts, uncomment the line in the [run()](file:///d:/Product Development/productdevelopment/src/main/java/com/htc/productdevelopment/util/FirebaseUserSyncUtil.java#L38-L42) method of [FirebaseUserSyncUtil](file:///d:/Product%20Development/productdevelopment/src/main/java/com/htc/productdevelopment/util/FirebaseUserSyncUtil.java#L12-L48):

```java
@Override
public void run(String... args) throws Exception {
    logger.info("FirebaseUserSyncUtil initialized");
    
    // Uncomment the following line to automatically sync all users on startup
    syncAllFirebaseUsersToDatabase();
}
```

## What Gets Synced

For each Firebase user, the following information is stored in your database:
- `uid`: Firebase user ID (unique identifier)
- `email`: User's email address
- `name`: User's display name (if available)
- `role`: Default role set to USER
- `active`: Set to true by default
- `createdAt`: Timestamp when the user was created in your database
- `updatedAt`: Timestamp when the user was last updated

## Important Notes

1. **Existing Users**: The synchronization process will skip users that already exist in your database (based on UID).

2. **Default Role**: All synchronized users are assigned the USER role by default. You can change roles later using the role update endpoint.

3. **Firebase Service Account**: Make sure your Firebase service account has the necessary permissions to list users.

4. **Rate Limiting**: For large Firebase projects, the synchronization might take some time due to Firebase API rate limits.

## Troubleshooting

If synchronization fails, check:
1. Firebase service account configuration
2. Database connectivity
3. Application logs for error messages
4. Firebase user permissions