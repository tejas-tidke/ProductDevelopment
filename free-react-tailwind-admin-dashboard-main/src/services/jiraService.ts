// src/services/jiraService.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Generic API call function for Jira endpoints
async function jiraApiCall(endpoint: string, options: RequestInit = {}) {
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API call failed: ${response.statusText}`);
  }
  
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
};

export default { jiraService };