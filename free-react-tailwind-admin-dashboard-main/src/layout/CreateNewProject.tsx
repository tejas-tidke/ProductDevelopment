import React, { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { jiraService } from "../services/jiraService";

const CreateNewProject: React.FC = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get the leadAccountId from your Jira instance
      // This would typically be fetched from the backend or user profile
      const leadAccountId = "712020:e76ff0c5-0ebc-41bf-8fc3-e73173216221"; // Default placeholder
      
      const projectData = {
        key: projectKey,
        name: projectName,
        projectTypeKey: "software",
        projectTemplateKey: "com.pyxis.greenhopper.jira:gh-simplified-kanban-classic",
        description: description,
        leadAccountId: leadAccountId,
        assigneeType: "PROJECT_LEAD"
      };

      // Call the backend API to create the project
      const createdProject = await jiraService.createProject(projectData);
      
      // Extract project ID from the response (could be id or key)
      const projectId = createdProject.id || createdProject.key || projectKey;

      setSuccess("Project created successfully!");
      
      // Redirect to the project detail page after a short delay
      // We'll use the project ID for navigation
      setTimeout(() => {
        navigate(`/project/${projectId}`);
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create project";
      setError(errorMessage);
      console.error("Error creating project:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageMeta
        title="Create New Project"
        description="Create a new project in the system"
      />
      <PageBreadcrumb pageTitle="Create New Project" />
      
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          <h3 className="mb-6 text-center font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            Create New Project
          </h3>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Form Section */}
            <div className="w-full lg:w-1/2">
              <div className="rounded-lg bg-gray-50 p-6 dark:bg-gray-800">
                <p className="text-gray-600 dark:text-gray-300">
                  This is where you can create a new project. Add your project details below:
                </p>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  </div>
                )}
                
                {success && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{success}</span>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter project name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" 
                      value={projectKey}
                      onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter project key (e.g., PROJ)"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Enter project description"
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                      onClick={() => {
                        setProjectName("");
                        setProjectKey("");
                        setDescription("");
                        setError(null);
                        setSuccess(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : "Create Project"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Illustration Section */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
              <div className="max-w-md w-full flex items-center justify-center">
                <img 
                  src="/images/project-illustration.png" 
                  alt="Project Creation Illustration" 
                  className="max-w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNewProject;