import { jiraService } from "../../../services/jiraService";
import { Issue } from "./request.types";

// Service functions for request management
export const requestService = {
  // Get all projects
  getAllProjects: async () => {
    try {
      return await jiraService.getAllProjects();
    } catch (err) {
      console.warn("Failed fetch projects", err);
      return [];
    }
  },

  // Get issue types
  getIssueTypes: async () => {
    try {
      return await jiraService.getIssueTypes();
    } catch (err) {
      console.warn("Failed fetch issue types", err);
      return [];
    }
  },

  // Get custom fields
  getFields: async () => {
    try {
      const fields = await jiraService.getFields();
      return Array.isArray(fields) ? fields.filter(f => f.custom) : [];
    } catch (err) {
      console.warn("Failed fetch fields", err);
      return [];
    }
  },

  // Get all issues with filtering by user context
  getAllIssues: async (userRole: string | null, userOrganizationId: string | null, userDepartmentId: string | null) => {
    try {
      console.log("Calling getAllIssues with:", { userRole, userOrganizationId, userDepartmentId });
      
      // Convert string IDs to numbers as expected by the backend
      const orgId = userOrganizationId ? parseInt(userOrganizationId, 10) : null;
      const deptId = userDepartmentId ? parseInt(userDepartmentId, 10) : null;
      
      const resp = await jiraService.getAllIssues(userRole, orgId, deptId);
      console.log("Received response from getAllIssues:", resp);
      
      const allIssues: Issue[] = Array.isArray(resp) ? resp : (resp && Array.isArray(resp.issues) ? resp.issues : []);
      console.log("Processed issues count:", allIssues.length);
      
      // Filter by project name
      const filtered = allIssues.filter((i: Issue) => {
        const projectName = i.fields?.project?.name;
        console.log("Issue project name:", projectName);
        return projectName === "Request Management";
      });
      
      console.log("Filtered issues count:", filtered.length);
      return filtered;
    } catch (err) {
      console.error("Failed fetch issues", err);
      throw new Error("Failed to load requests.");
    }
  },

  // Delete an issue
  deleteIssue: async (issueKey: string) => {
    return await jiraService.deleteIssue(issueKey);
  },

  // Update an issue
  updateIssue: async (issueKey: string, data: any) => {
    return await jiraService.updateIssue(issueKey, data);
  }
};