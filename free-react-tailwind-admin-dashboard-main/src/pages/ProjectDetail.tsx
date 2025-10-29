import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import ProjectTabs from "../components/common/ProjectTabs";
import { jiraService } from "../services/jiraService";

// Define the Jira project data type
interface JiraProject {
  id: string;
  key: string;
  name: string;
  description: string;
  projectTypeKey: string;
  lead?: string;
}

// Define the Jira issue data type
interface JiraIssue {
  id: string;
  key: string;
  fields?: {
    summary?: string;
    description?: string;
    summaryText?: string;
    status?: {
      name?: string;
      statusCategory?: {
        name?: string;
      };
    };
    issuetype?: {
      name?: string;
      description?: string;
    };
    priority?: {
      name?: string;
    };
    assignee?: {
      displayName?: string;
      name?: string;
      emailAddress?: string;
    };
  };
}

const ProjectDetail: React.FC = () => {
  // Get the project ID from the URL parameters
  const { projectId } = useParams<{ projectId: string }>();
  
  // State variables for managing component data
  const [project, setProject] = useState<JiraProject | null>(null);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [issuesLoading, setIssuesLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "board" | "calendar">("list");
  
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
          setIssuesLoading(true);
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
        } catch (err) {
          // Handle errors
          console.error("Error fetching issues:", err);
          setError(err instanceof Error ? err.message : "Failed to fetch issues");
        } finally {
          setIssuesLoading(false);
        }
      }
    };
    
    fetchIssues();
  }, [project, activeTab]);
  
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {project.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Project Key: {project.key}
          </p>
        </div>
        
        {/* Tab navigation */}
        <ProjectTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Tab content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {/* List view - shows issues in a table */}
          {activeTab === "list" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Issues List</h2>
              {issuesLoading ? (
                // Show loading spinner while fetching issues
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading issues...</span>
                </div>
              ) : error ? (
                // Show error message if there was an error fetching issues
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-900">
                  <h3 className="text-red-800 font-medium dark:text-red-200">Error Loading Issues</h3>
                  <p className="text-red-700 mt-1 dark:text-red-300">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                // Show issues table
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Key
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Summary
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Priority
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Assignee
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {issues && issues.length > 0 ? (
                        // Map through issues and display each one
                        issues.map((issue) => {
                          return (
                            <tr key={issue.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                                {issue.key || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {issue.fields?.summary || "No summary"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {issue.fields?.issuetype?.name || "Unknown"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                  {issue.fields?.status?.name || "Unknown"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {issue.fields?.priority?.name || "Unknown"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {issue.fields?.assignee?.displayName || "Unassigned"}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        // Show message if no issues found
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No issues found for this project
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
    </div>
  );
};

export default ProjectDetail;