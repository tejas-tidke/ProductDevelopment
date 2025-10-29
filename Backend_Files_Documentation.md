# Backend Files Documentation

This document provides detailed documentation for each file in the backend Spring Boot application, including methods, functions, and integration points with the frontend.

## Project Structure

```
src/main/java/com/htc/productdevelopment/
├── ProductdevelopmentApplication.java
├── config/
│   ├── CorsConfig.java
│   ├── FirebaseConfig.java
│   ├── JiraConfig.java
│   └── WebConfig.java
├── controller/
│   ├── AuthController.java
│   ├── DiagnosticController.java
│   └── JiraController.java
├── model/
│   ├── JiraProject.java
│   └── User.java
├── repository/
│   └── UserRepository.java
├── service/
│   ├── FirebaseSyncService.java
│   ├── JiraService.java
│   └── UserService.java
```

## Main Application Class

### ProductdevelopmentApplication.java
**Location**: `src/main/java/com/htc/productdevelopment/ProductdevelopmentApplication.java`

**Purpose**: Main entry point for the Spring Boot application.

**Key Features**:
- Annotated with `@SpringBootApplication` to enable auto-configuration
- Annotated with `@EnableCaching` to enable caching capabilities

**Methods**:
- `main(String[] args)`: Launches the Spring Boot application

**Integration with Frontend**:
- Serves as the starting point for all backend APIs consumed by the frontend
- Hosts all REST controllers that the frontend communicates with

## Configuration Classes

### CorsConfig.java
**Location**: `src/main/java/com/htc/productdevelopment/config/CorsConfig.java`

**Purpose**: Configures Cross-Origin Resource Sharing (CORS) to allow frontend requests.

**Key Features**:
- Allows requests from `http://localhost:5173` (Vite development server)
- Configures allowed methods, headers, and credentials

**Methods**:
- `corsConfigurationSource()`: Creates and configures the CORS configuration source

**Integration with Frontend**:
- Enables the React frontend to make API calls to the backend without CORS errors
- Essential for local development where frontend and backend run on different ports

### FirebaseConfig.java
**Location**: `src/main/java/com/htc/productdevelopment/config/FirebaseConfig.java`

**Purpose**: Initializes the Firebase Admin SDK for authentication and user management.

**Key Features**:
- Reads Firebase service account credentials from `firebase-service-account.json`
- Initializes Firebase app with credentials

**Methods**:
- `firebaseApp()`: Creates and initializes the Firebase application instance
- `firebaseAuth()`: Provides Firebase Authentication instance

**Integration with Frontend**:
- Works with frontend Firebase authentication to validate user tokens
- Enables user synchronization between Firebase and local database

### JiraConfig.java
**Location**: `src/main/java/com/htc/productdevelopment/config/JiraConfig.java`

**Purpose**: Configures Jira API connection settings.

**Key Features**:
- Reads Jira credentials from `application.properties`
- Provides a `RestTemplate` bean for HTTP requests

**Methods**:
- Getters for `baseUrl`, `email`, and `apiToken`
- `restTemplate()`: Creates and configures a RestTemplate bean

**Integration with Frontend**:
- Provides backend services that fetch Jira data for frontend display
- Not directly integrated but enables all Jira-related frontend features

### WebConfig.java
**Location**: `src/main/java/com/htc/productdevelopment/config/WebConfig.java`

**Purpose**: Additional web configuration for the application.

**Key Features**:
- Configures message converters for JSON serialization

**Methods**:
- `configureMessageConverters()`: Configures Jackson for JSON processing

**Integration with Frontend**:
- Ensures proper JSON serialization/deserialization for API responses
- Supports consistent data format between frontend and backend

## Controller Classes

### AuthController.java
**Location**: `src/main/java/com/htc/productdevelopment/controller/AuthController.java`

**Purpose**: Handles authentication-related API endpoints.

**Key Features**:
- User registration and synchronization
- Role management
- User profile operations
- CORS enabled for `http://localhost:5173`

**Methods**:
- `createFirebaseUser()`: Creates a new Firebase user and syncs to database (POST /api/auth/create-user)
- `registerUser()`: Registers a user in the local database (POST /api/auth/register)
- `syncFirebaseUser()`: Syncs Firebase user data to local database (POST /api/auth/sync-firebase-user)
- `syncFirebaseUserByToken()`: Syncs user by Firebase token (POST /api/auth/sync-firebase-user-token)
- `getUserRole()`: Gets user role by UID (GET /api/auth/role/{uid})
- `isAdmin()`: Checks if user is admin (GET /api/auth/isAdmin/{uid})
- `isUser()`: Checks if user is regular user (GET /api/auth/isUser/{uid})
- `getUsersByRole()`: Gets users by role (GET /api/auth/users/role/{role})
- `getActiveUsers()`: Gets active users (GET /api/auth/users/active)
- `getInactiveUsers()`: Gets inactive users (GET /api/auth/users/inactive)
- `updateUserRole()`: Updates user role (PUT /api/auth/role/{uid})
- `updateUserAvatar()`: Updates user avatar (PUT /api/auth/avatar/{uid})
- `autoSyncUser()`: Automatically syncs Firebase user with default role (POST /api/auth/auto-sync)

**Integration with Frontend**:
- `/api/auth/auto-sync`: Called during frontend login to sync user and get role
- `/api/auth/role/{uid}`: Called to check user permissions
- `/api/auth/update-role/{uid}`: Called when admin updates user roles
- Various user management endpoints used in admin dashboard

### DiagnosticController.java
**Location**: `src/main/java/com/htc/productdevelopment/controller/DiagnosticController.java`

**Purpose**: Provides diagnostic and testing endpoints.

**Key Features**:
- Health checks
- Testing utilities
- Debugging endpoints

**Methods**:
- `ping()`: Simple health check endpoint (GET /api/diag/ping)
- `testConnection()`: Tests database connection (GET /api/diag/test-connection)
- `getUserCount()`: Gets user count (GET /api/diag/user-count)
- `getEnv()`: Gets environment variables (GET /api/diag/env)
- `simulateError()`: Simulates an error for testing (GET /api/diag/simulate-error)
- `simulateDelay()`: Simulates network delay (GET /api/diag/simulate-delay)

**Integration with Frontend**:
- Used primarily for development and debugging
- Not directly integrated with frontend in production

### JiraController.java
**Location**: `src/main/java/com/htc/productdevelopment/controller/JiraController.java`

**Purpose**: Handles Jira integration API endpoints.

**Key Features**:
- Project management
- Issue tracking
- CORS enabled for `http://localhost:5173`

**Methods**:
- `getRecentProjects()`: Gets recent Jira projects (GET /api/jira/projects/recent)
- `getAllProjects()`: Gets all Jira projects (GET /api/jira/projects)
- `getProjectByIdOrKey()`: Gets specific project by ID or key (GET /api/jira/projects/{projectIdOrKey})
- `getIssuesForProject()`: Gets issues for a project (GET /api/jira/projects/{projectKey}/issues)
- `createProject()`: Creates a new Jira project (POST /api/jira/projects)

**Integration with Frontend**:
- `/api/jira/projects`: Called by AllProjects page to display projects
- `/api/jira/projects/{id}`: Called by ProjectDetail page to get project info
- `/api/jira/projects/{key}/issues`: Called by ProjectDetail page to get issues for List view

## Model Classes

### JiraProject.java
**Location**: `src/main/java/com/htc/productdevelopment/model/JiraProject.java`

**Purpose**: Represents a Jira project entity.

**Key Features**:
- Data model for Jira projects
- Lombok annotations for boilerplate reduction

**Fields**:
- `id`: Project ID
- `key`: Project key
- `name`: Project name
- `description`: Project description
- `projectTypeKey`: Project type
- `lead`: Project lead

**Integration with Frontend**:
- Serialized to JSON and sent to frontend for project display
- Used in project listing and detail pages

### User.java
**Location**: `src/main/java/com/htc/productdevelopment/model/User.java`

**Purpose**: Represents a user entity in the local database.

**Key Features**:
- JPA entity with database mapping
- User roles (ADMIN/USER)
- Avatar support
- Timestamps for creation/update

**Fields**:
- `id`: Primary key
- `uid`: Firebase UID (unique)
- `email`: User email (unique)
- `name`: User name
- `avatar`: User avatar (base64)
- `role`: User role (ADMIN/USER enum)
- `active`: User active status
- `createdAt`: Creation timestamp
- `updatedAt`: Update timestamp

**Integration with Frontend**:
- User data sent to frontend for profile display
- Role information used for access control in UI

## Repository Classes

### UserRepository.java
**Location**: `src/main/java/com/htc/productdevelopment/repository/UserRepository.java`

**Purpose**: Database repository for User entities.

**Key Features**:
- JPA repository with custom query methods
- Database indexes for performance

**Methods**:
- `findByUid()`: Finds user by Firebase UID
- `findByEmail()`: Finds user by email
- `existsByUid()`: Checks if user exists by UID
- `existsByEmail()`: Checks if user exists by email
- `findByRole()`: Finds users by role
- `findByActive()`: Finds users by active status
- `findByRoleAndActive()`: Finds users by role and active status
- `countByRole()`: Counts users by role
- `countByActive()`: Counts users by active status

**Integration with Frontend**:
- Supports all user-related API endpoints consumed by frontend
- Enables user management features in admin dashboard

## Service Classes

### FirebaseSyncService.java
**Location**: `src/main/java/com/htc/productdevelopment/service/FirebaseSyncService.java`

**Purpose**: Synchronizes Firebase users with local database.

**Key Features**:
- User creation in Firebase
- User data synchronization
- Automatic role assignment

**Methods**:
- `createFirebaseUser()`: Creates Firebase user and syncs to database
- `syncFirebaseUserToDB()`: Syncs Firebase user to local database
- `syncFirebaseUserByToken()`: Syncs user by Firebase token
- `getOrCreateUserFromFirebase()`: Gets or creates user from Firebase data
- `syncAllFirebaseUsers()`: Syncs all Firebase users to database
- `getAllUsers()`: Gets all users from database
- `getUsersByRole()`: Gets users by role
- `getActiveUsers()`: Gets active users
- `getInactiveUsers()`: Gets inactive users
- `checkDatabaseConnection()`: Checks database connection
- `validateSchema()`: Validates database schema
- `autoSyncFirebaseUser()`: Automatically syncs Firebase user with default role

**Integration with Frontend**:
- Supports authentication endpoints used by frontend
- Enables automatic user provisioning on first login

### JiraService.java
**Location**: `src/main/java/com/htc/productdevelopment/service/JiraService.java`

**Purpose**: Handles communication with Jira REST API.

**Key Features**:
- Jira API integration
- Project and issue management
- HTTP request handling

**Methods**:
- `getRecentProjects()`: Gets recent Jira projects
- `getAllProjects()`: Gets all Jira projects
- `getProjectByIdOrKey()`: Gets specific project by ID or key
- `getIssuesForProject()`: Gets issues for a project
- `createProject()`: Creates a new Jira project
- `makeJiraApiCall()`: Makes authenticated Jira API calls
- `getTextValue()`: Helper to extract text values from JSON

**Integration with Frontend**:
- Provides data for all Jira-related frontend features
- Powers project listing and issue tracking UI

### UserService.java
**Location**: `src/main/java/com/htc/productdevelopment/service/UserService.java`

**Purpose**: Manages user-related business logic.

**Key Features**:
- User creation and management
- Role management
- Profile updates

**Methods**:
- `createUser()`: Creates a new user
- `getUserByUid()`: Gets user by Firebase UID
- `getUserByEmail()`: Gets user by email
- `updateUserRole()`: Updates user role
- `updateUser()`: Updates user email and name
- `updateUserAvatar()`: Updates user avatar
- `isAdmin()`: Checks if user is admin
- `isUser()`: Checks if user is regular user
- `getUsersByRole()`: Gets users by role
- `getUsersByActiveStatus()`: Gets users by active status
- `getUsersByRoleAndActiveStatus()`: Gets users by role and active status
- `countUsersByRole()`: Counts users by role
- `countUsersByActiveStatus()`: Counts users by active status

**Integration with Frontend**:
- Supports all user management API endpoints
- Enables profile updates and role-based access control