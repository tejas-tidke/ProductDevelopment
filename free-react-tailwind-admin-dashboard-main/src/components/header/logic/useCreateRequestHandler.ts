import { jiraService } from "../../../services/jiraService";

export const useCreateRequestHandler = () => {
  // Handle create issue submission
  const handleCreateIssue = async (issueData: {
    issueType: string;
    summary: string;
    project: string;
    description: string;
    dueDate: string;
    assigneeCustom?: string;
    reporterCustom?: string;
  }) => {
    console.log("Creating issue:", issueData);
    try {
      // Call the API to create the issue
      await jiraService.createIssue(issueData);
      
      // Show success message
      console.log("Issue created successfully!");
      
      // Dispatch a custom event to notify other components to refresh the issue list
      window.dispatchEvent(new CustomEvent('issueCreated', { detail: issueData }));
      
      // In a real implementation, you would also:
      // 1. Refresh the issue list in the current project view
      // 2. Update the UI to show the new issue
    } catch (error) {
      console.error("Error creating issue:", error);
      alert("Failed to create issue. Please try again.");
    }
  };

  return {
    handleCreateIssue
  };
};