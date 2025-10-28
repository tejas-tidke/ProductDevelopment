import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import ProjectTabs from "../components/common/ProjectTabs";

interface JiraProject {
  id: string;
  key: string;
  name: string;
  description: string;
  projectTypeKey: string;
  lead?: string;
}

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<JiraProject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "board" | "calendar">("list");
  
  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        setError(null);
        // In a real implementation, you would fetch the project data here
        // For now, we'll create a mock project
        const mockProject: JiraProject = {
          id: projectId,
          key: projectId,
          name: `Project ${projectId}`,
          description: "This is a sample project description.",
          projectTypeKey: "software",
          lead: "John Doe"
        };
        setProject(mockProject);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch project details";
        setError(errorMessage);
        console.error("Error fetching project details:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectDetails();
  }, [projectId]);
  
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
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
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
          {activeTab === "list" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">List View</h2>
              <p className="text-gray-600 dark:text-gray-400">
                This is the list view for project: {project.name}
              </p>
              {/* Add your list view content here */}
            </div>
          )}
          
          {activeTab === "board" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Board View</h2>
              <p className="text-gray-600 dark:text-gray-400">
                This is the board view for project: {project.name}
              </p>
              {/* Add your board view content here */}
            </div>
          )}
          
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