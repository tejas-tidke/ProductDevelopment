# Frontend Files Documentation

This document provides detailed documentation for each file in the frontend React application, including components, functions, and integration points with the backend.

## Project Structure

```
src/
├── App.tsx
├── main.tsx
├── components/
│   ├── common/
│   │   └── ProjectTabs.tsx
│   └── [other component directories]
├── pages/
│   ├── AllProjects.tsx
│   ├── ProjectDetail.tsx
│   └── [other page components]
├── services/
│   ├── jiraService.ts
│   ├── userService.ts
│   └── api.ts
├── [other directories]
```

## Main Application Files

### App.tsx
**Location**: `src/App.tsx`

**Purpose**: Main application component that sets up routing and layout.

**Key Features**:
- Application routing configuration
- Main layout structure
- Route definitions for different pages

**Components/Functions**:
- Main App component that wraps all pages
- React Router configuration
- Navigation structure

**Integration with Backend**:
- Routes API calls to appropriate backend endpoints
- Connects frontend pages to backend services
- Handles authentication flow with backend

### main.tsx
**Location**: `src/main.tsx`

**Purpose**: Entry point for the React application.

**Key Features**:
- Renders the main App component
- Sets up React DOM rendering
- Initializes the application

**Components/Functions**:
- `ReactDOM.createRoot()`: Creates React root
- Renders App component into DOM

**Integration with Backend**:
- Bootstraps the entire application that communicates with backend
- No direct backend integration but enables all subsequent API calls

## Component Files

### ProjectTabs.tsx
**Location**: `src/components/common/ProjectTabs.tsx`

**Purpose**: Tab navigation component for project detail views.

**Key Features**:
- Tab interface with List, Board, and Calendar options
- Active tab state management
- Responsive design

**Props**:
- `activeTab`: Current active tab ("list" | "board" | "calendar")
- `setActiveTab`: Function to change active tab

**Components/Functions**:
- `ProjectTabs`: Main component rendering tab navigation
- Tab button rendering with active state styling

**Integration with Backend**:
- Controls which project data view is displayed
- Triggers different API calls based on active tab
- Works with ProjectDetail page to show different data views

## Page Files

### AllProjects.tsx
**Location**: `src/pages/AllProjects.tsx`

**Purpose**: Page displaying all Jira projects.

**Key Features**:
- Project listing with search and filtering
- Project cards with key information
- Loading and error states
- Navigation to project details

**State Variables**:
- `projects`: Array of Jira projects
- `loading`: Loading state indicator
- `error`: Error message if API call fails

**Components/Functions**:
- `AllProjects`: Main page component
- `useEffect` hook for fetching projects on component mount
- Project card rendering
- Error and loading state handling

**Integration with Backend**:
- Calls `/api/jira/projects` to fetch all projects
- Calls `/api/jira/projects/recent` to fetch recent projects
- Uses jiraService for API communication
- Displays data received from backend JiraService

### ProjectDetail.tsx
**Location**: `src/pages/ProjectDetail.tsx`

**Purpose**: Page displaying detailed information about a specific project.

**Key Features**:
- Project details display
- Tabbed interface (List, Board, Calendar)
- Issue listing for List view
- Loading and error states

**State Variables**:
- `project`: Current project data
- `issues`: Array of project issues
- `loading`: Loading state for project data
- `issuesLoading`: Loading state for issues
- `error`: Error message
- `activeTab`: Currently active tab

**Components/Functions**:
- `ProjectDetail`: Main page component
- `useEffect` hooks for fetching project and issue data
- Tab content rendering based on active tab
- Issue table rendering in List view
- Error and loading state handling

**Integration with Backend**:
- Calls `/api/jira/projects/{projectId}` to fetch project details
- Calls `/api/jira/projects/{projectKey}/issues` to fetch issues
- Uses jiraService for API communication
- Displays data received from backend JiraService

## Service Files

### jiraService.ts
**Location**: `src/services/jiraService.ts`

**Purpose**: Service for handling all Jira-related API calls.

**Key Features**:
- Centralized Jira API communication
- Error handling and response parsing
- Reusable API functions

**Interfaces**:
- `ProjectData`: Structure for project creation data
- `JiraIssue`: Structure for Jira issue data

**Functions**:
- `jiraApiCall()`: Generic function for making Jira API calls
- `jiraService.getRecentProjects()`: Calls `/api/jira/projects/recent`
- `jiraService.getAllProjects()`: Calls `/api/jira/projects`
- `jiraService.createProject()`: Calls `/api/jira/projects` (POST)
- `jiraService.getProjectByIdOrKey()`: Calls `/api/jira/projects/{projectIdOrKey}`
- `jiraService.getIssuesForProject()`: Calls `/api/jira/projects/{projectKey}/issues`

**Integration with Backend**:
- Direct communication with JiraController endpoints
- Handles all Jira data fetching for frontend components
- Provides consistent error handling for Jira API calls

### userService.ts
**Location**: `src/services/userService.ts`

**Purpose**: Service for handling all user-related API calls.

**Key Features**:
- Centralized user API communication
- Authentication and user management
- Error handling and response parsing

**Functions**:
- `apiCall()`: Generic function for making user API calls
- `userService.getCurrentUser()`: Gets current user data
- `userService.getUserRole()`: Gets user role by UID
- `userService.isAdmin()`: Checks if user is admin
- `userService.isUser()`: Checks if user is regular user
- `userService.updateUserRole()`: Updates user role
- `userService.autoSyncUser()`: Automatically syncs user with backend

**Integration with Backend**:
- Direct communication with AuthController endpoints
- Handles all user authentication and management for frontend
- Provides user context for role-based access control

### api.ts
**Location**: `src/services/api.ts`

**Purpose**: Generic API service for handling HTTP requests.

**Key Features**:
- Base API configuration
- Common HTTP methods
- Error handling
- Request/response interceptors

**Functions**:
- `api.get()`: Generic GET request
- `api.post()`: Generic POST request
- `api.put()`: Generic PUT request
- `api.delete()`: Generic DELETE request
- `apiCall()`: Generic function for making API calls

**Integration with Backend**:
- Used by other service files as base for API communication
- Handles common API concerns like headers and error handling
- Provides consistent interface for all backend API calls

## Integration Flow

### Authentication Flow
1. **Frontend**: User logs in with Firebase
2. **Frontend**: Calls `userService.autoSyncUser()` with Firebase UID
3. **Backend**: AuthController receives request at `/api/auth/auto-sync`
4. **Backend**: FirebaseSyncService processes user synchronization
5. **Backend**: Returns user data and role to frontend
6. **Frontend**: Stores user data in application state

### Project Listing Flow
1. **Frontend**: AllProjects page mounts
2. **Frontend**: Calls `jiraService.getAllProjects()`
3. **Backend**: JiraController receives request at `/api/jira/projects`
4. **Backend**: JiraService fetches data from Jira API
5. **Backend**: Returns project data to frontend
6. **Frontend**: Displays projects in UI

### Project Detail Flow
1. **Frontend**: User navigates to project detail page
2. **Frontend**: ProjectDetail page mounts
3. **Frontend**: Calls `jiraService.getProjectByIdOrKey()`
4. **Backend**: JiraController receives request at `/api/jira/projects/{id}`
5. **Backend**: JiraService fetches project data from Jira API
6. **Backend**: Returns project data to frontend
7. **Frontend**: Displays project details

### Issue Listing Flow
1. **Frontend**: User selects "List" tab in project detail
2. **Frontend**: Calls `jiraService.getIssuesForProject()`
3. **Backend**: JiraController receives request at `/api/jira/projects/{key}/issues`
4. **Backend**: JiraService fetches issues from Jira API
5. **Backend**: Returns issue data to frontend
6. **Frontend**: Displays issues in table format

## State Management

### Component State
- Local component state using React `useState` hook
- Loading and error states for API calls
- Form input states
- UI interaction states (active tabs, etc.)

### Data Flow
1. **User Interaction**: User performs action (click, form submit, etc.)
2. **API Call**: Service function makes call to backend endpoint
3. **Backend Processing**: Controller handles request, service processes data
4. **Response**: Backend returns data to frontend
5. **State Update**: Component updates state with received data
6. **UI Update**: Component re-renders with new data

## Error Handling

### API Errors
- All service functions handle HTTP errors
- Error messages displayed to user
- Retry mechanisms where appropriate

### Network Errors
- Timeout handling
- Connection error detection
- Fallback UI for offline states

### Data Errors
- Validation of received data
- Graceful handling of missing or malformed data
- Default values for missing data