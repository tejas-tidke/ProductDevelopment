// src/services/jiraService.ts
// Service for handling Jira API calls
import { auth } from "../firebase";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Generic API call function for Jira endpoints
async function jiraApiCall(endpoint: string, options: RequestInit = {}) {
  // Configure request headers
  const config: RequestInit = {
    headers: {
  "Accept": "application/json",
  ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
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

export interface ContractIssuePayload {
  vendorDetails: {
    vendorName: string;
    productName: string;
    vendorContractType: string;
    currentUsageCount: string;
    currentUnits: string;
    currentLicenseCount: string;
    newUsageCount: string;
    newUnits: string;
    newLicenseCount: string;

    dueDate: string;
    renewalDate: string;

    requesterName: string;
    requesterMail: string;
    department: string;
    organization: string;
    additionalComment: string;

    contractMode: string; // "new" | "existing"
    selectedExistingContractId: string;

    licenseUpdateType: string;
  };
}

// Define the product item structure
export interface ProductItem {
  id: string;
  productName: string;
  nameOfVendor?: string;
  productLink?: string;
  productType?: 'license' | 'usage'; // New field to indicate if product is license-based or usage-based
}

// Jira API functions
export const jiraService = {

   // 1️⃣ Get Request Management Project (only one project is allowed)
  getRequestManagementProject: () =>
    jiraApiCall("/api/jira/projects/request-management"),

  // 2️⃣ Get all Vendors for dropdown
  getVendors: () => jiraApiCall("/api/jira/vendors"),

  // 3️⃣ Get all Products for a Vendor
  getProductsByVendor: (vendorName: string) =>
    jiraApiCall(`/api/jira/vendors/${vendorName}/products`),
    
  // 4️⃣ Get product type for a Vendor and Product
  getProductType: (vendorName: string, productName: string) =>
    jiraApiCall(`/api/jira/vendors/${vendorName}/products/${productName}/type`),
    
  // 5️⃣ Get products of a specific type for a Vendor
  getProductsByVendorAndType: (vendorName: string, productType: string) =>
    jiraApiCall(`/api/jira/vendors/${vendorName}/products/type/${productType}`),

  // 6️⃣ Get ALL existing contracts for dropdown
  getContracts: () => jiraApiCall("/api/jira/contracts"),

  // New method to get contracts by contract type
  getContractsByType: (contractType: string) => 
    jiraApiCall(`/api/jira/contracts/type/${contractType}`),

  // New method to get contracts by contract type as DTOs
  getContractsByTypeAsDTO: (contractType: string) => 
    jiraApiCall(`/api/jira/contracts/type/${contractType}/dto`),

  // 7️⃣ Get one contract by ID (used when selecting existing contract)
  getContractById: (id: string) =>
    jiraApiCall(`/api/jira/contracts/${id}`),

  // 8️⃣ Get existing license count (upgrade/downgrade)
  getLicenseCount: (vendorName: string, productName: string) =>
    jiraApiCall(
      `/api/jira/contracts/license-count?vendor=${vendorName}&product=${productName}`
    ),

  // 9️⃣ Create Contract Issue (NEW API)
  createContractIssue: async (payload: ContractIssuePayload) => {
  const user = auth.currentUser;

  // Auto-fill requester fields from logged-in Firebase user
  const requesterName = user?.displayName || "Unknown User";
  const requesterMail = user?.email || "";

  console.log("📡 Sending Contract Issue to backend with auto-filled user:", {
    requesterName,
    requesterMail,
  });

  const vd = payload.vendorDetails;

  const toText = (v: unknown): string =>
    v === null || v === undefined ? "" : String(v);

  const finalPayload: ContractIssuePayload = {
    vendorDetails: {
      vendorName: toText(vd.vendorName),
      productName: toText(vd.productName),
      vendorContractType: toText(vd.vendorContractType),
      currentUsageCount: toText(vd.currentUsageCount),
      currentUnits: toText(vd.currentUnits),
      currentLicenseCount: toText(vd.currentLicenseCount),

      newUsageCount: toText(vd.newUsageCount),
      newUnits: toText(vd.newUnits),
      newLicenseCount: toText(vd.newLicenseCount),

      dueDate: toText(vd.dueDate),
      renewalDate: toText(vd.renewalDate),

      // 🔥 Auto-filled
      requesterName: requesterName,
      requesterMail: requesterMail,

      department: toText(vd.department),
      organization: toText(vd.organization),
      additionalComment: toText(vd.additionalComment),

      contractMode: toText(vd.contractMode),
      selectedExistingContractId: toText(vd.selectedExistingContractId),

      licenseUpdateType: toText(vd.licenseUpdateType),
    },
  };

  return jiraApiCall("/api/jira/contracts/create", {
    method: "POST",
    body: JSON.stringify(finalPayload),
  });
},





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
  
  // Get a specific issue by ID or key
  getIssueByIdOrKey: (issueIdOrKey: string) =>
  jiraApiCall(`/api/jira/issues/${issueIdOrKey}?expand=names,fields,renderedFields`),

  getIssue: (issueKey: string) =>
  jiraApiCall(`/api/jira/issues/${issueKey}?expand=names,fields,renderedFields`),
  
  // Get issues for a specific project
  getIssuesForProject: (projectKey: string) => jiraApiCall(`/api/jira/projects/${projectKey}/issues`),
  
  // Get all issues across all projects
  getAllIssues: async (userRole?: string | null, userOrganizationId?: number | null, userDepartmentId?: number | null) => {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (userRole) {
      params.append('userRole', userRole);
    }
    
    if (userOrganizationId) {
      params.append('userOrganizationId', userOrganizationId.toString());
    }
    
    if (userDepartmentId) {
      params.append('userDepartmentId', userDepartmentId.toString());
    }
    
    const queryString = params.toString();
    const url = queryString ? `/api/jira/issues?${queryString}` : "/api/jira/issues";
    
    return jiraApiCall(url);
  },

  // Get recent issues across all projects
  getRecentIssues: () => jiraApiCall("/api/jira/issues/recent"),
  
  // Get all fields from Jira
  getFields: () => jiraApiCall("/api/jira/fields"),
  
  // Get comments for a specific issue
  getIssueComments: (issueIdOrKey: string) => jiraApiCall(`/api/jira/issues/${issueIdOrKey}/comments`),
  
  // Get worklogs for a specific issue
  getIssueWorklogs: (issueIdOrKey: string) => jiraApiCall(`/api/jira/issues/${issueIdOrKey}/worklogs`),
  
  // Get attachments for a specific issue
  getIssueAttachments: (issueIdOrKey: string) => jiraApiCall(`/api/jira/issues/${issueIdOrKey}/attachments`),
  
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
      body: JSON.stringify({
        transition: {
          id: transitionId
        }
      }),
    });
  },

  // Add an attachment to an issue
  addAttachmentToIssue: (issueIdOrKey: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return jiraApiCall(`/api/jira/issues/${issueIdOrKey}/attachments`, {
      method: "POST",
      body: formData,
      headers: {},
    });
  },

  // Test Jira API connectivity
  testJiraConnectivity: () => jiraApiCall("/api/jira/test-connectivity"),

  // Get all issue types from Jira
  getIssueTypes: (): Promise<JiraIssueType[]> =>
    jiraApiCall("/api/jira/issuetypes"),

  getCreateMeta: async (projectKey?: string) => {
    try {
      const endpoint = projectKey
        ? `/api/jira/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes.fields`
        : `/api/jira/issue/createmeta?expand=projects.issuetypes.fields`;

      const response = await jiraApiCall(endpoint);

      if (response && response.projects) return response.projects;
      if (Array.isArray(response)) return response;
      return [];
    } catch (error) {
      console.error("Error in getCreateMeta:", error);
      throw error;
    }
  },

  createIssue: (issueData: IssueData) =>
    jiraApiCall("/api/jira/issues", {
      method: "POST",
      body: JSON.stringify(issueData),
    }),

  updateIssue: (issueIdOrKey: string, issueData: IssueUpdateData) =>
    jiraApiCall(`/api/jira/issues/${issueIdOrKey}`, {
      method: "PUT",
      body: JSON.stringify(issueData),
    }),

  deleteIssue: (issueIdOrKey: string) =>
    jiraApiCall(`/api/jira/issues/${issueIdOrKey}`, {
      method: "DELETE",
    }),

 // Replace old createIssueJira completely

createIssueJira: async (payload: ContractIssuePayload) => {

  console.log("📡 Sending to backend /api/jira/contracts/create:", payload);

  const vd = payload.vendorDetails;

  const toText = (v: unknown): string =>
    v === null || v === undefined ? "" : String(v);

  const finalPayload: ContractIssuePayload = {
    vendorDetails: {
      vendorName:               toText(vd.vendorName),
      productName:              toText(vd.productName),
      vendorContractType:       toText(vd.vendorContractType),
      currentUsageCount:        toText(vd.currentUsageCount),
      currentUnits:             toText(vd.currentUnits),
      currentLicenseCount:      toText(vd.currentLicenseCount),

      newUsageCount:            toText(vd.newUsageCount),
      newUnits:                 toText(vd.newUnits),
      newLicenseCount:          toText(vd.newLicenseCount),

      dueDate:                  toText(vd.dueDate),
      renewalDate:              toText(vd.renewalDate),

      requesterName:            toText(vd.requesterName),
      requesterMail:            toText(vd.requesterMail),
      department:               toText(vd.department),
      organization:             toText(vd.organization),
      additionalComment:        toText(vd.additionalComment),

      contractMode:             toText(vd.contractMode),
      selectedExistingContractId: toText(vd.selectedExistingContractId),

      licenseUpdateType:        toText(vd.licenseUpdateType),
    },
  };

  return jiraApiCall("/api/jira/contracts/create", {
    method: "POST",
    body: JSON.stringify(finalPayload),
  });
},




  addAttachmentToIssueJira: async (issueKey: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return jiraApiCall(`/api/jira/issues/${issueKey}/attachments`, {
      method: "POST",
      body: formData,
      headers: {
        "X-Atlassian-Token": "no-check",
      },
    });
  },

  getCurrentUser: () => jiraApiCall("/api/jira/myself"),

  addCommentToIssue: (issueIdOrKey: string, commentBody: string) =>
    jiraApiCall(`/api/jira/issues/${issueIdOrKey}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: commentBody }),
    }),

}; // END OF OBJECT

export default jiraService;
