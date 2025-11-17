# Product Development Project

A full-stack web application built with React (Vite + Tailwind CSS) for the frontend and Spring Boot (Java) for the backend, using MySQL for data persistence.

## 📋 Project Overview

This project is a task and project management system that integrates with Jira for issue tracking and Firebase for user authentication. It provides a dashboard interface for managing projects, viewing issues, and user administration.

### Key Features
- User authentication with Firebase
- Jira integration for project and issue management
- Role-based access control (Admin/User)
- Project dashboard with multiple views (List, Board, Calendar)
- User management and profile handling

## 🛠️ Tech Stack

### Frontend
- **React** - JavaScript library for building user interfaces
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Typed superset of JavaScript

### Backend
- **Spring Boot** - Java framework for building web applications
- **MySQL** - Relational database management system
- **Firebase Admin SDK** - Server-side Firebase integration
- **Jira REST API** - Integration with Atlassian Jira

## 📁 Project Structure

### Backend (productdevelopment/)
```
src/main/java/com/htc/productdevelopment/
├── config/                 # Configuration classes
│   ├── CorsConfig.java     # CORS configuration
│   ├── FirebaseConfig.java # Firebase SDK initialization
│   ├── JiraConfig.java     # Jira API configuration
│   └── WebConfig.java      # Web configuration
├── controller/             # REST API controllers
│   ├── AuthController.java # Authentication endpoints
│   ├── DiagnosticController.java # Diagnostic endpoints
│   └── JiraController.java # Jira integration endpoints
├── exception/              # Custom exception handlers
├── model/                  # Data models/entities
│   ├── JiraProject.java    # Jira project data model
│   └── User.java           # User data model
├── repository/             # Database repositories
│   └── UserRepository.java # User database operations
├── service/                # Business logic services
│   ├── FirebaseSyncService.java # Firebase user synchronization
│   ├── JiraService.java    # Jira API integration
│   └── UserService.java    # User management
└── util/                   # Utility classes
```

### Frontend (free-react-tailwind-admin-dashboard-main/)
```
src/
├── components/             # Reusable UI components
├── config/                 # Configuration files
├── context/                # React context providers
├── hooks/                  # Custom React hooks
├── layout/                 # Page layouts
├── pages/                  # Page components
├── services/               # API service functions
└── utils/                  # Utility functions
```

## ⚙️ Setup and Installation

### Prerequisites
- Java 17+
- Node.js 16+
- MySQL 8.0+
- Firebase project with authentication enabled
- Jira Cloud account with API access

### Backend Setup

1. **Environment Setup**
   - Follow the detailed [Setup Guide](SETUP.md) to configure Java, Maven, and Lombok correctly
   - This is crucial to avoid compilation issues

2. **Database Configuration**
   - Create a MySQL database named `product_development_db`
   - Update database credentials in `src/main/resources/application.properties`

3. **Firebase Configuration**
   - Download your Firebase service account key
   - Place it in `src/main/resources/firebase-service-account.json`

4. **Jira Configuration**
   - Update Jira credentials in `src/main/resources/application.properties`
   - Set your Jira base URL, email, and API token

5. **Run the Backend**
   ```bash
   cd productdevelopment
   ./mvnw spring-boot:run
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd free-react-tailwind-admin-dashboard-main
   npm install
   ```

2. **Environment Variables**
   - Create a `.env` file in the root directory
   - Set `VITE_API_URL=http://localhost:8080`

3. **Run the Frontend**
   ```bash
   npm run dev
   ```

## 🔄 Data Flow

```
Frontend (React) ↔ Backend API (Spring Boot) ↔ Database (MySQL)
                     ↕
               External APIs (Firebase, Jira)
```

1. **User Authentication Flow**
   - User logs in via Firebase on frontend
   - Frontend sends Firebase UID to backend `/api/auth/auto-sync`
   - Backend syncs user with database and assigns role
   - Backend returns user role to frontend

2. **Project Management Flow**
   - Frontend requests Jira projects via `/api/jira/projects`
   - Backend calls Jira REST API
   - Backend processes and returns project data
   - Frontend displays projects in dashboard

3. **Issue Management Flow**
   - User selects a project in frontend
   - Frontend requests issues via `/api/jira/projects/{key}/issues`
   - Backend calls Jira REST API with project key
   - Backend returns issue data
   - Frontend displays issues in selected view (List/Board/Calendar)

## 📡 API Endpoints

### Authentication Endpoints
| Method | URL | Purpose |
|--------|-----|---------|
| POST | `/api/auth/auto-sync` | Automatically sync Firebase user with database |
| POST | `/api/auth/create-user` | Create new Firebase user |
| GET | `/api/auth/role/{uid}` | Get user role by UID |
| GET | `/api/auth/isAdmin/{uid}` | Check if user is admin |
| GET | `/api/auth/isUser/{uid}` | Check if user is regular user |

### Jira Endpoints
| Method | URL | Purpose |
|--------|-----|---------|
| GET | `/api/jira/projects/recent` | Get recent Jira projects |
| GET | `/api/jira/projects` | Get all Jira projects |
| GET | `/api/jira/projects/{idOrKey}` | Get specific project |
| GET | `/api/jira/projects/{projectKey}/issues` | Get issues for project |
| POST | `/api/jira/projects` | Create new Jira project |

## 🧩 Frontend Components

### Main Pages
- **Dashboard** - Overview of projects and metrics
- **All Projects** - List of all Jira projects
- **Project Detail** - Detailed view of a specific project with tabs
- **User Profiles** - User management and profile settings
- **Calendar** - Calendar view of tasks and events

### Shared Components
- **ProjectTabs** - Tab navigation for project views (List, Board, Calendar)
- **Header** - Navigation bar with user profile
- **Sidebar** - Main navigation menu

## 🗄️ Database Structure

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| uid | VARCHAR | Firebase UID (unique) |
| email | VARCHAR | User email (unique) |
| name | VARCHAR | User full name |
| avatar | LONGTEXT | User profile image |
| role | ENUM | User role (SUPER_ADMIN/ADMIN/APPROVER/REQUESTER) |
| active | BOOLEAN | User active status |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Record last update time |

### Indexes
- `idx_user_uid` - Index on Firebase UID for fast lookups
- `idx_user_email` - Index on email for fast lookups
- `idx_user_role` - Index on role for filtering
- `idx_user_active` - Index on active status for filtering

## 🔧 Environment Configuration

### Backend (application.properties)
```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/product_development_db
spring.datasource.username=your_username
spring.datasource.password=your_password

# Jira Configuration
jira.base-url=https://your-domain.atlassian.net
jira.email=your_email@domain.com
jira.api-token=your_api_token

# Firebase Configuration (in firebase-service-account.json)
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8080
```

## 🚀 Common Commands

### Backend
```bash
# Run development server
./mvnw spring-boot:run

# Build for production
./mvnw clean package

# Run tests
./mvnw test

# Clean build artifacts
./mvnw clean
```

### Frontend
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 📝 Development Guidelines

### Backend Coding Standards
1. **Controller Layer** - Handles HTTP requests and responses
2. **Service Layer** - Contains business logic
3. **Repository Layer** - Handles database operations
4. **Model Layer** - Data models and entities

### Frontend Coding Standards
1. **Components** - Reusable UI elements
2. **Pages** - Full page views
3. **Services** - API communication
4. **Hooks** - Custom React hooks
5. **Context** - State management

### Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for classes and components
- Use UPPER_SNAKE_CASE for constants
- Use descriptive names that explain purpose

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL is running
   - Verify database credentials in application.properties
   - Ensure database `product_development_db` exists

2. **Firebase Authentication Not Working**
   - Check firebase-service-account.json exists
   - Verify Firebase project configuration
   - Ensure Firebase user exists

3. **Jira API Not Returning Data**
   - Check Jira credentials in application.properties
   - Verify Jira API token permissions
   - Confirm project key exists in Jira

4. **CORS Errors**
   - Check CorsConfig.java settings
   - Ensure frontend URL is allowed in CORS configuration

5. **Lombok Compilation Errors**
   - Follow the detailed setup instructions in [SETUP.md](SETUP.md)
   - Refer to the comprehensive [Lombok Troubleshooting Guide](LOMBOK_TROUBLESHOOTING.md) for detailed solutions
   - Ensure annotation processing is enabled in your IDE
   - Use the Maven Wrapper for building (`./mvnw` or `mvnw.cmd`)

6. **ClassNotFoundException**
   - Check that you're using the correct main class name: `com.htc.productdevelopment.ProductdevelopmentApplication`
   - Clean and rebuild using Maven Wrapper

### Logs and Debugging
- Backend logs are available in console when running
- Frontend logs can be viewed in browser developer tools
- Enable debug logging by changing log levels in application.properties

## 📚 Additional Documentation

- [Getting Started Guide](GETTING_STARTED.md) - Step-by-step setup instructions
- [Backend Documentation](BACKEND_DOCUMENTATION.md) - Detailed backend architecture
- [Frontend Documentation](FRONTEND_DOCUMENTATION.md) - Detailed frontend architecture
- [Technology Guide](TECHNOLOGY_GUIDE.md) - Introduction to technologies for new team members
- Firebase Integration Guide: `FIREBASE_INTEGRATION.md`
- Jira Integration Guide: `JIRA_INTEGRATION.md`
- Firebase User Sync Documentation: `FIREBASE_USER_SYNC.md`

## 👥 Team Development

This project is designed to be beginner-friendly with:
- Clear separation of concerns
- Well-documented code with comments
- Consistent naming conventions
- Simple data flow patterns
- Comprehensive error handling

### Standardized Environment

All team members should follow the [Standardized Environment Guide](STANDARDIZED_ENVIRONMENT.md) to ensure consistency and prevent common issues like Lombok compilation errors.