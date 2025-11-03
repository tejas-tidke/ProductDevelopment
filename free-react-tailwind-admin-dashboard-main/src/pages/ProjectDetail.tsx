import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router";
import ProjectTabs from "../components/common/ProjectTabs";
import { jiraService } from "../services/jiraService";
import DynamicJiraTable from "../components/tables/DynamicJiraTable";
import { JiraIssue, useJiraTable } from "../hooks/useJiraTable";
import CreateIssueModal from "../components/modals/CreateIssueModal";

// Define the Jira project data type
interface JiraProject {
  id: string;
  key: string;
  name: string;
  description: string;
  projectTypeKey: string;
  lead?: string;
}

const ProjectDetail: React.FC = () => {
  // Get the project ID from the URL parameters
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State variables for managing component data
  const [project, setProject] = useState<JiraProject | null>(null);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "board" | "calendar">("list");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  
  // Use the jira table hook for column management
  const { updateData } = useJiraTable(issues);
  
  // Check if createIssue parameter is present in URL
  useEffect(() => {
    const createIssueParam = searchParams.get('createIssue');
    if (createIssueParam === 'true') {
      setIsCreateModalOpen(true);
      // Remove the parameter from URL
      searchParams.delete('createIssue');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);
  
  // Fetch project details when the component mounts or projectId changes
  useEffect(() => {
    const fetchProjectDetails = async () => {
      // Return early if no project ID
      if (!projectId) return;
      
      try {
        setLoading(true);
        setError(null);
        // Call the API to get project details
        const projectData = await jiraService.getProjectByIdOrKey(projectId);
        setProject(projectData);
      } catch (err) {
        // Handle errors
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch project details";
        setError(errorMessage);
        console.error("Error fetching project details:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectDetails();
  }, [projectId]);
  
  // Fetch issues when the project is loaded and when switching to the list tab
  useEffect(() => {
    const fetchIssues = async () => {
      // Only fetch issues if we have a project and are on the list tab
      if (project && activeTab === "list") {
        try {
          setError(null); // Clear any previous errors
          console.log("Fetching issues for project key:", project.key);
          // Call the API to get issues for the project
          const issuesData = await jiraService.getIssuesForProject(project.key);
          console.log("Full issues data received:", JSON.stringify(issuesData, null, 2));
          
          // Extract issues from the response (Jira API returns issues in 'issues' array)
          const issuesArray = issuesData.issues || [];
          console.log("Issues array length:", issuesArray.length);
          console.log("First few issues:", issuesArray.slice(0, 3));
          
          setIssues(issuesArray);
          updateData(issuesArray); // Update the data in the hook
        } catch (err) {
          // Handle errors
          console.error("Error fetching issues:", err);
          setError(err instanceof Error ? err.message : "Failed to fetch issues");
        }
      }
    };
    
    fetchIssues();
  }, [project, activeTab, updateData]);
  
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
      
      // Refresh the issues list
      if (project) {
        const issuesData = await jiraService.getIssuesForProject(project.key);
        const issuesArray = issuesData.issues || [];
        setIssues(issuesArray);
        updateData(issuesArray);
      }
      
      // Close the modal
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating issue:", error);
      alert("Failed to create issue. Please try again.");
    }
  };
  
  // Handle export issues to CSV
  const handleExportIssues = async () => {
    try {
      if (!project) return;
      
      // Fetch all issues for the project
      const issuesData = await jiraService.getIssuesForProject(project.key);
      const issuesArray = issuesData.issues || [];
      
      if (issuesArray.length === 0) {
        alert("No issues to export");
        return;
      }
      
      // Convert issues to CSV format
      const csvContent = convertIssuesToCSV(issuesArray);
      
      // Create a blob and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${project.key}_issues.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log("Issues exported successfully!");
    } catch (error) {
      console.error("Error exporting issues:", error);
      alert("Failed to export issues. Please try again.");
    }
  };
  
  // Convert issues to CSV format
  const convertIssuesToCSV = (issues: JiraIssue[]): string => {
    // Define CSV headers
    const headers = ['Key', 'Summary', 'Issue Type', 'Status', 'Assignee', 'Created'];
    
    // Create CSV rows
    const rows = issues.map(issue => {
      return [
        issue.key || '',
        issue.fields?.summary || '',
        issue.fields?.issuetype?.name || '',
        issue.fields?.status?.name || '',
        issue.fields?.assignee?.displayName || 'Unassigned',
        issue.fields?.created || ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });
    
    // Combine headers and rows
    return [headers.join(','), ...rows].join('\n');
  };
  
  // Show loading spinner while fetching project details
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-3 text-gray-600 dark:text-gray-400">Loading project details...</p>
        </div>
      </div>
    );
  }
  
  // Show error message if there was an error fetching project details
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 dark:bg-red-900/20 dark:border-red-900">
            <h1 className="text-xl font-semibold text-red-800 dark:text-red-200">Error Loading Project</h1>
            <p className="text-red-700 mt-2 dark:text-red-300">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show not found message if no project was found
  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Project Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              No project found with ID: {projectId}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Main component render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Project header with name and key */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Project Key: {project.key}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleExportIssues}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Export Issues
            </button>
          </div>
        </div>
        
        {/* Tab navigation */}
        <ProjectTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Tab content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {/* List view - shows issues in a table */}
          {activeTab === "list" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Issues List</h2>
              
              {/* Dynamic table with pagination and column selector */}
              <DynamicJiraTable 
                projectKey={project.key}
              />
              
              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-900 mt-4">
                  <h3 className="text-red-800 font-medium dark:text-red-200">Error Loading Issues</h3>
                  <p className="text-red-700 mt-1 dark:text-red-300">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Board view - placeholder content */}
          {activeTab === "board" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Board View</h2>
              <p className="text-gray-600 dark:text-gray-400">
                This is the board view for project: {project.name}
              </p>
              {/* Add your board view content here */}
            </div>
          )}
          
          {/* Calendar view - placeholder content */}
          {activeTab === "calendar" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Calendar View</h2>
              <p className="text-gray-600 dark:text-gray-400">
                This is the calendar view for project: {project.name}
              </p>
              {/* Add your calendar view content here */}
            </div>
          )}
        </div>
      </div>
      
      {/* Create Issue Modal - Positioned outside of main content to properly overlay everything */}
      <CreateIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateIssue}
      />
    </div>
  );
};

export default ProjectDetail;