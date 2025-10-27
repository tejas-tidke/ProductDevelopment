import React from "react";
import { useParams } from "react-router";

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Project: {projectId}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Project details would be displayed here
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Project Information
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This page would show detailed information about the project with ID: {projectId}
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            In a full implementation, this would fetch and display project details from Jira.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;