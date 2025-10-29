# Frontend Documentation

## Project Structure

```
src/
├── App.tsx                 # Main application component
├── components/             # Reusable UI components
│   ├── common/             # Common components used across the app
│   ├── Dashboard/          # Dashboard-specific components
│   ├── Layouts/            # Page layouts
│   └── ...                 # Other component categories
├── config/                 # Configuration files
├── context/                # React context providers
├── hooks/                  # Custom React hooks
├── layout/                 # Page layouts
├── pages/                  # Page components
│   ├── AllProjects.tsx     # All projects page
│   ├── ProjectDetail.tsx   # Project detail page
│   └── ...                 # Other pages
├── services/               # API service functions
│   ├── jiraService.ts      # Jira API service
│   └── ...                 # Other services
├── utils/                  # Utility functions
└── main.tsx                # Application entry point
```

## Component Architecture

The frontend follows a component-based architecture with the following patterns:

1. **Pages** - Top-level components that represent entire pages
2. **Components** - Reusable UI elements
3. **Services** - API communication layers
4. **Hooks** - Custom React hooks for shared logic
5. **Context** - State management providers

## Key Components

### Pages
- **ProjectDetail** - Displays detailed information about a specific project
- **AllProjects** - Shows a list of all Jira projects
- **Dashboard** - Main dashboard with project overview

### Components
- **ProjectTabs** - Tab navigation for switching between project views
- **Header** - Navigation bar with user profile
- **Sidebar** - Main navigation menu

### Services
- **jiraService** - Handles all communication with the backend Jira API

## Data Flow

1. **User Interaction** → Component event handler is triggered
2. **Component** → Calls appropriate Service function
3. **Service** → Makes API call to backend
4. **Backend** → Processes request and returns data
5. **Service** → Returns data to Component
6. **Component** → Updates state and re-renders UI

## State Management

The application uses React's built-in state management with:
- **useState** - For local component state
- **useEffect** - For side effects and data fetching
- **useContext** - For global state when needed
- **React Router** - For navigation and URL parameters

## Styling

The application uses Tailwind CSS for styling with:
- **Utility classes** - For rapid UI development
- **Dark mode support** - Using Tailwind's dark mode variants
- **Responsive design** - Mobile-first approach with responsive utilities

## Routing

The application uses React Router for navigation:
- **Route parameters** - For dynamic pages like project details
- **Programmatic navigation** - Using hooks for redirects
- **Nested routes** - For organizing complex page structures

## API Integration

All API calls are handled through service files that:
- **Encapsulate** - API endpoints and request logic
- **Handle errors** - With consistent error handling
- **Return promises** - For easy async/await usage
- **Type safety** - With TypeScript interfaces

## Error Handling

The application implements error handling at multiple levels:
- **API errors** - Caught and displayed to users
- **UI errors** - Fallback UI for loading and error states
- **Validation** - Input validation with user feedback