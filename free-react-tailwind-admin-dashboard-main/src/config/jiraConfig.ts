// Jira API Configuration
export const JIRA_CONFIG = {
  // Base URL for your backend API
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  
  // API endpoints
  apiEndpoints: {
    recentProjects: '/api/jira/projects/recent',
    allProjects: '/api/jira/projects',
  }
};

// Log configuration for debugging
console.log('Jira Config Loaded:', {
  baseUrl: JIRA_CONFIG.baseUrl,
});

// Get the request URL for backend API
export const getJiraRequestUrl = (endpoint: string) => {
  return `${JIRA_CONFIG.baseUrl}${endpoint}`;
};

// Headers for backend API requests
export const getJiraAuthHeaders = () => {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
};
