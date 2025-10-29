// src/services/jiraService.ts
// Service for handling Jira API calls
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Generic API call function for Jira endpoints
async function jiraApiCall(endpoint: string, options: RequestInit = {}) {
  // Configure request headers
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...options.headers,
    },
    ...options,
  };

  // Make the API call
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  // Handle errors
  if (!response.ok) {
    let errorMessage = `API call failed: ${response.statusText}`;
    try {
      const errorData = await response.json().catch(() => ({}));
      errorMessage = errorData.message || errorMessage;
    } catch (error) {
      // If we can't parse the error response, use the status text
      console.error("Error parsing error response:", error);
    }
    throw new Error(errorMessage);
  }
  
  // Return the response data
  return response.json();
}

// Define the project data type
interface ProjectData {
  key: string;
  name: string;
  projectTypeKey: string;
  projectTemplateKey: string;
  description: string;
  leadAccountId: string;
  assigneeType: string;
}

// Jira API functions
export const jiraService = {
  // Get recent projects
  getRecentProjects: () => jiraApiCall("/api/jira/projects/recent"),
  
  // Get all projects
  getAllProjects: () => jiraApiCall("/api/jira/projects"),
  
  // Create a new project
  createProject: (projectData: ProjectData) => jiraApiCall("/api/jira/projects", {
    method: "POST",
    body: JSON.stringify(projectData),
  }),
  
  // Get a specific project by ID or key
  getProjectByIdOrKey: (projectIdOrKey: string) => jiraApiCall(`/api/jira/projects/${projectIdOrKey}`),
  
  // Get issues for a specific project
  getIssuesForProject: (projectKey: string) => jiraApiCall(`/api/jira/projects/${projectKey}/issues`),
};

export default { jiraService };