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
    // Add timeout to prevent hanging requests
    signal: AbortSignal.timeout(30000), // 30 second timeout
    ...options,
  };

  try {
    console.log(`Making API call to ${endpoint} with config:`, config);
    // Make the API call
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    console.log(`API call to ${endpoint}:`, response.status, response.statusText);
    
    // Handle errors
    if (!response.ok) {
      let errorMessage = `API call failed: ${response.statusText} (${response.status})`;
      try {
        const errorData = await response.json().catch(() => ({}));
        errorMessage = errorData.message || errorMessage;
        console.error(`Error response from ${endpoint}:`, errorData);
      } catch {
        // If we can't parse the error response as JSON, try to get text
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
          console.error(`Error response text from ${endpoint}:`, errorText);
        } catch {
          // If we can't get text either, use the status text
          console.error("Error parsing error response");
        }
      }
      throw new Error(errorMessage);
    }
    
    // Handle empty responses (204 No Content)
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0' || response.status === 204) {
      return {}; // Return empty object for no-content responses
    }
    
    // Try to parse JSON response
    try {
      const data = await response.json();
      console.log(`Successful response from ${endpoint}:`, data);
      return data;
    } catch {
      // If JSON parsing fails, try to get text response
      try {
        const textResponse = await response.text();
        console.log(`Text response from ${endpoint}:`, textResponse);
        // If text response is empty, return empty object
        if (!textResponse.trim()) {
          return {};
        }
        // Otherwise, return the text response
        return textResponse;
      } catch {
        console.error(`Error getting text response from ${endpoint}`);
        return {}; // Return empty object as fallback
      }
    }
  } catch (error) {
    console.error(`Error making API call to ${endpoint}:`, error);
    // Provide more detailed error information
    if (error instanceof Error) {
      // Check if it's a timeout error
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: The server took too long to respond. Please try again later.');
      }
      // Check if it's a network error
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      }
      throw new Error(`Failed to connect to Jira API: ${error.message}`);
    } else {
      throw new Error(`Failed to connect to Jira API: Unknown error occurred`);
    }
  }
}

// Define the project data type
export interface ProjectData {
  key: string;
  name: string;
  projectTypeKey: string;
  projectTemplateKey: string;
  description: string;
  leadAccountId: string;
  assigneeType: string;
}

// Define the issue data type
export interface IssueData {
  issueType: string;
  summary: string;
  project: string;
  description: string;
  dueDate: string;
  assignee?: string;
}

// Define the issue update data type
export interface IssueUpdateData {
  issueType: string;
  summary: string;
  project: string;
  description: string;
  dueDate: string;
  assigneeCustom?: string;
  reporterCustom?: string;
}

// Define the issue type data type
export interface JiraIssueType {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
}

// Define the assignee data type
export interface Assignee {
  accountId: string;
  displayName: string;
  avatarUrls: {
    '48x48': string;
  };
}

// Define the transition data type
export interface IssueTransition {
  id: string;
  name: string;
  to: {
    id: string;
    name: string;
    statusCategory: {
      id: number;
      key: string;
      colorName: string;
    };
  };
}

// Define the project metadata type
export interface ProjectMeta {
  id: string;
  key: string;
  name: string;
  description: string;
  projectTypeKey: string;
  issuetypes: JiraIssueType[];
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
  
  // Get all issues across all projects
  getAllIssues: () => jiraApiCall("/api/jira/issues"),
  
  // Get recent issues across all projects
  getRecentIssues: () => jiraApiCall("/api/jira/issues/recent"),
  
  // Get all fields from Jira
  getFields: () => jiraApiCall("/api/jira/fields"),
  
  // Test Jira API connectivity
  testJiraConnectivity: () => jiraApiCall("/api/jira/test-connectivity"),
  
  // Get all issue types from Jira
  getIssueTypes: (): Promise<JiraIssueType[]> => jiraApiCall("/api/jira/issuetypes"),
  
  // Get assignable users for a project
  getAssignableUsers: (projectKey: string): Promise<Assignee[]> => jiraApiCall(`/api/jira/projects/${projectKey}/assignable`),
  
  // Create a new issue
  createIssue: (issueData: IssueData) => jiraApiCall("/api/jira/issues", {
    method: "POST",
    body: JSON.stringify(issueData),
  }),
  
  // Update an existing issue
  updateIssue: (issueIdOrKey: string, issueData: IssueUpdateData) => jiraApiCall(`/api/jira/issues/${issueIdOrKey}`, {
    method: "PUT",
    body: JSON.stringify(issueData),
  }),
  
  // Delete an issue by ID or key
  deleteIssue: (issueIdOrKey: string) => jiraApiCall(`/api/jira/issues/${issueIdOrKey}`, {
    method: "DELETE",
  }),
  
  // Get a specific issue by ID or key
  getIssueByIdOrKey: (issueIdOrKey: string) => jiraApiCall(`/api/jira/issues/${issueIdOrKey}`),
  
  // Get comments for a specific issue
  getIssueComments: (issueIdOrKey: string) => jiraApiCall(`/api/jira/issues/${issueIdOrKey}/comments`),
  
  // Get worklogs for a specific issue
  getIssueWorklogs: (issueIdOrKey: string) => jiraApiCall(`/api/jira/issues/${issueIdOrKey}/worklogs`),
  
  // Get attachments for a specific issue
  getIssueAttachments: (issueIdOrKey: string) => jiraApiCall(`/api/jira/issues/${issueIdOrKey}/attachments`),
  
  // Get attachment content by ID
  getAttachmentContent: (attachmentId: string) => jiraApiCall(`/api/jira/attachment/content/${attachmentId}`, {
    headers: {
      "Accept": "*/*"
    }
  }),
  
  // Add an attachment to an issue
  addAttachmentToIssue: (issueIdOrKey: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return jiraApiCall(`/api/jira/issues/${issueIdOrKey}/attachments`, {
      method: "POST",
      body: formData,
      // Override default headers for multipart/form-data
      headers: {
        // Don't set Content-Type, let the browser set it with the boundary
      }
    });
  },
  
  // Get transitions for a specific issue
  getIssueTransitions: async (issueIdOrKey: string): Promise<IssueTransition[]> => {
    console.log(`Fetching transitions for issue: ${issueIdOrKey}`);
    const response = await jiraApiCall(`/api/jira/issues/${issueIdOrKey}/transitions`);
    console.log("Raw transitions response:", response);
    console.log("Response type:", typeof response);
    
    // Handle different response formats
    if (response && typeof response === 'object' && 'transitions' in response && Array.isArray(response.transitions)) {
      console.log("Returning transitions from response.transitions:", response.transitions.length);
      return response.transitions;
    }
    if (Array.isArray(response)) {
      console.log("Returning transitions from array:", response.length);
      return response;
    }
    console.log("Returning empty transitions array");
    return [];
  },

  // Transition an issue to a new status
  transitionIssue: async (issueIdOrKey: string, transitionId: string) => {
    console.log(`Transitioning issue: ${issueIdOrKey} with transition ID: ${transitionId}`);
    return jiraApiCall(`/api/jira/issues/${issueIdOrKey}/transitions`, {
      method: "POST",
      body: JSON.stringify({ transitionId }),
    });
  },

  // Fetch metadata dynamically for Create Issue
  getCreateMeta: async (projectKey?: string) => {
    const endpoint = projectKey
      ? `/api/jira/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes.fields`
      : `/api/jira/issue/createmeta?expand=projects.issuetypes.fields`;
      
    const response = await jiraApiCall(endpoint);
    return response.projects || [];
  },

  // Create new issue with Jira's expected payload structure
  createIssueJira: async (data: IssueData) => {
    const payload = {
      fields: {
        project: { key: data.project },
        summary: data.summary,
        description: data.description || "",
        issuetype: { name: data.issueType },
        duedate: data.dueDate || null,
        ...(data.assignee ? { assignee: { name: data.assignee } } : {}),
      },
    };
    const response = await jiraApiCall("/api/jira/issues/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response;
  },

  // Upload attachment with required header
  addAttachmentToIssueJira: async (issueKey: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await jiraApiCall(`/api/jira/issues/${issueKey}/attachments`, {
      method: "POST",
      body: formData,
      // Override default headers for multipart/form-data
      headers: {
        "X-Atlassian-Token": "no-check", // required for Jira Cloud
        // Don't set Content-Type, let the browser set it with the boundary
      },
    });
    return response;
  },

  // Get current user information
  getCurrentUser: async () => {
    const response = await jiraApiCall("/api/jira/myself");
    return response;
  },

};

export default { jiraService };