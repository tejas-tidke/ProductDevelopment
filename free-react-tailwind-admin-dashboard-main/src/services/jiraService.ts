// src/services/jiraService.ts
// Service for handling Jira API calls
import { auth } from "../firebase";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const jiraTransitionMap: Record<string, string> = {
  // Approve Transitions
  "approve-request-created": "3",
  "approve-pre-approval": "2",
  "approve-request-review": "4",
  "approve-negotiation-stage": "5",
  "approve-post-approval": "7",

  // Decline transitions (always ID 6)
  "decline-request-created": "6",
  "decline-pre-approval": "6",
  "decline-request-review": "6",
  "decline-negotiation": "6",
  "decline-post-approval": "6",
};

// Generic API call function for Jira endpoints
async function jiraApiCall(endpoint: string, options: RequestInit = {}) {

  const isFormData = options.body instanceof FormData;

  const headers: any = {
    Accept: "application/json",
    ...(options.headers || {})
  };

  // ❌ DO NOT SET CONTENT-TYPE FOR FORMDATA
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method || "GET",
    body: options.body,
    headers,
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || response.statusText);
  }

  if (response.status === 204) return {};

  return response.json().catch(() => response.text());
}

async function getProposalById(id: number) {
  return jiraApiCall(`/api/jira/proposals/${id}`);
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

// Define the proposal data interface
export interface ProposalData {
  proposalType: string;
  licenseCount: string;
  unitCost: string;
  totalCost: string;
  attachmentIds: string | null;
  issueKey: string | undefined;
}

export interface CreateVendorPayload {
  nameOfVendor: string;
  productName: string;
  productLink?: string;
  productType: string;
}

async function createVendor(payload: CreateVendorPayload): Promise<ProductItem> {
  const response = await fetch("/api/jira/vendors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create vendor (status ${response.status})`);
  }

  return response.json();
}


async function getLastUploadedAttachment(issueKey: string, fileName: string) {
  // Fetch issue with attachment field
  const issue = await jiraApiCall(`/api/jira/issues/${issueKey}?expand=fields`);

  const attachments = issue?.fields?.attachment || [];

  // Find attachment by filename
  const latest = attachments.find((a: any) => a.filename === fileName);

  if (!latest) {
    console.warn(`⚠ No attachment found for filename: ${fileName}`);
    return null;
  }

  return {
    id: latest.id,
    filename: latest.filename,
    size: latest.size,
    content: latest.content,
    mimeType: latest.mimeType,
    created: latest.created,
    author: latest.author?.displayName,
  };
}

// Delete a vendor product by ID
async function deleteVendorProduct(id: number | string): Promise<void> {
  await jiraApiCall(`/api/jira/vendors/${id}`, {
    method: "DELETE",
  });
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

  // Get ALL products (Vendor Details)
  getAllProducts: () => jiraApiCall("/api/jira/products"),

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
  createContractIssue: async (payload: any) => {
    return jiraApiCall("/api/jira/contracts/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
   
   //  Create Vendor
  createVendor: async (payload: CreateVendorPayload) => {
    return jiraApiCall("/api/jira/vendors", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

   // Remove Vendor
  deleteVendorProduct: (id: number | string) => deleteVendorProduct(id),

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

    console.log("getAllIssues called with:", { userRole, userOrganizationId, userDepartmentId });

    if (userRole) {
      params.append('userRole', userRole);
    }

    // Ensure the values are properly converted to strings
    if (userOrganizationId !== null && userOrganizationId !== undefined) {
      params.append('userOrganizationId', userOrganizationId.toString());
    }

    if (userDepartmentId !== null && userDepartmentId !== undefined) {
      params.append('userDepartmentId', userDepartmentId.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/api/jira/issues?${queryString}` : "/api/jira/issues";

    console.log("Final URL:", url);
    console.log("Query parameters being sent:", { userRole, userOrganizationId, userDepartmentId });

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
  // Transition using predefined mapping
  transitionIssue: async (issueIdOrKey: string, transitionKey: string) => {
    const realTransitionId = jiraTransitionMap[transitionKey];

    if (!realTransitionId) {
      throw new Error(`Invalid transition key: ${transitionKey}`);
    }

    return jiraApiCall(`/api/jira/issues/${issueIdOrKey}/transitions`, {
      method: "POST",
      body: JSON.stringify({
        transition: { id: realTransitionId },
      }),
    });
  },

  // Transition using raw ID (used in your UI)
  transitionIssueCustom: async (issueKey: string, transitionId: string) => {
    return jiraApiCall(`/api/jira/issues/${issueKey}/transitions`, {
      method: "POST",
      body: JSON.stringify({
        transition: { id: transitionId },
      }),
    });
  },



  // Add an attachment to an issue
  addAttachmentToIssue: async (issueIdOrKey: string, file: File) => {

    const formData = new FormData();
    formData.append("file", file);

    // ❗ MUST use raw fetch — NOT jiraApiCall()
    const response = await fetch(`${API_BASE_URL}/api/jira/issues/${issueIdOrKey}/attachments`, {
      method: "POST",
      body: formData,
      headers: {
        "X-Atlassian-Token": "no-check"   // Jira-required header
        // DO NOT SET CONTENT-TYPE HERE
      },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Upload failed: ${err}`);
    }

    const jiraResponse = await response.json();

    // Extract Jira metadata
    const attachmentInfo = jiraResponse[0];
    const metadata = {
      fileName: attachmentInfo.filename,
      content: attachmentInfo.content,
      size: attachmentInfo.size,
      mimeType: attachmentInfo.mimeType,
    };

    // Save to your backend DB
    await jiraApiCall("/api/jira/contracts/save-attachment", {
      method: "POST",
      body: JSON.stringify({
        issueKey: issueIdOrKey,
        metadata,
      }),
    });

    return jiraResponse;
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

        requesterName: toText(vd.requesterName),
        requesterMail: toText(vd.requesterMail),
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


  getCurrentUser: () => jiraApiCall("/api/jira/myself"),

  addCommentToIssue: (issueIdOrKey: string, commentBody: string) =>
    jiraApiCall(`/api/jira/issues/${issueIdOrKey}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: commentBody }),
    }),

  // Save proposal data with attachments
  saveProposal: (proposalData: ProposalData) => {
    return jiraApiCall("/api/jira/proposals", {
      method: "POST",
      body: JSON.stringify(proposalData),
    });
  },

  // Get all proposals for a specific issue
  getProposalsByIssueKey: (issueKey: string) => {
    return jiraApiCall(`/api/jira/proposals/issue/${issueKey}`);
  },
  getLastUploadedAttachment,

  getProposalById,
}; // END OF OBJECT




export default jiraService;
