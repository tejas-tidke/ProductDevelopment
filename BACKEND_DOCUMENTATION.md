# Backend Documentation

## Project Structure

```
src/main/java/com/htc/productdevelopment/
├── ProductdevelopmentApplication.java  # Main application class
├── config/                             # Configuration classes
│   ├── CorsConfig.java                 # CORS configuration
│   ├── FirebaseConfig.java             # Firebase SDK configuration
│   ├── JiraConfig.java                 # Jira API configuration
│   └── WebConfig.java                  # Web configuration
├── controller/                         # REST API controllers
│   ├── AuthController.java             # Authentication endpoints
│   ├── DiagnosticController.java       # Diagnostic endpoints
│   └── JiraController.java             # Jira integration endpoints
├── exception/                          # Custom exception handlers
├── model/                              # Data models/entities
│   ├── JiraProject.java                # Jira project data model
│   └── User.java                       # User data model
├── repository/                         # Database repositories
│   └── UserRepository.java             # User database operations
├── service/                            # Business logic services
│   ├── FirebaseSyncService.java        # Firebase user synchronization
│   ├── JiraService.java                # Jira API integration
│   └── UserService.java                # User management
└── util/                               # Utility classes
```

## Layered Architecture

The backend follows a layered architecture pattern:

1. **Controller Layer** - Handles HTTP requests and responses
2. **Service Layer** - Contains business logic
3. **Repository Layer** - Handles database operations
4. **Model Layer** - Data models and entities

## Key Components

### Controllers
- **AuthController** - Manages user authentication and role management
- **JiraController** - Handles Jira integration endpoints
- **DiagnosticController** - Provides diagnostic and testing endpoints

### Services
- **UserService** - Manages user-related operations in the database
- **FirebaseSyncService** - Synchronizes Firebase users with the local database
- **JiraService** - Integrates with the Jira REST API

### Models
- **User** - Represents a user in the system with roles (SUPER_ADMIN/ADMIN/APPROVER/REQUESTER)
- **JiraProject** - Represents a Jira project with its properties

### Configuration
- **CorsConfig** - Configures Cross-Origin Resource Sharing
- **FirebaseConfig** - Initializes the Firebase Admin SDK
- **JiraConfig** - Configures Jira API credentials
- **WebConfig** - General web configuration

## Data Flow

1. **Incoming Request** → Controller method is called
2. **Controller** → Calls appropriate Service method
3. **Service** → Performs business logic and calls Repository if needed
4. **Repository** → Interacts with the database
5. **Service** → Processes data and returns result to Controller
6. **Controller** → Formats response and sends it back to client

## Error Handling

The application uses Spring Boot's built-in error handling mechanisms with custom exception handlers where needed. All controllers return appropriate HTTP status codes and error messages.

## Logging

All services and controllers use SLF4J logging to track operations, errors, and debug information. Log levels can be configured in `application.properties`.

## Security

- **CORS** - Configured to allow requests from the frontend
- **Firebase Authentication** - Used for user authentication
- **Jira API Tokens** - Used for Jira API authentication