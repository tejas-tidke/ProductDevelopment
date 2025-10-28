import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import ComponentCard from "../components/common/ComponentCard";
import PageMeta from "../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import Badge from "../components/ui/badge/Badge";
import { JIRA_CONFIG, getJiraAuthHeaders, getJiraRequestUrl } from "../config/jiraConfig";

type Project = {
  id: string;
  key: string;
  name: string;
  description: string;
  projectTypeKey: string;
  lead?: string;
};

const AllProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all projects from backend
  const fetchAllJiraProjects = async () => {
    console.log('Starting to fetch all Jira projects from backend...');
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the search projects API endpoint
      const apiUrl = getJiraRequestUrl(JIRA_CONFIG.apiEndpoints.allProjects);
      console.log('Making request to:', apiUrl);
      
      const headers = getJiraAuthHeaders();
      
      const response = await fetch(apiUrl, {
        headers: headers as HeadersInit,
        mode: 'cors',
        credentials: 'omit'
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: apiUrl
        });
        
        let errorMessage = `Backend API error (${response.status}): ${response.statusText}`;
        if (response.status === 401) {
          errorMessage = 'Authentication failed.';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden.';
        } else if (response.status === 404) {
          errorMessage = 'API endpoint not found.';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Backend API response:', data);
      
      // Define interface for the project data from backend
      interface BackendProject {
        id: string;
        key: string;
        name: string;
        description: string;
        projectTypeKey: string;
        lead?: string;
      }
      
      // Log each project to see what data we're getting
      data.forEach((project: BackendProject) => {
        console.log(`Project ${project.key}:`, project);
      });
      
      // Transform all Jira projects to our Project type
      const jiraProjects: Project[] = data.map((project: BackendProject) => ({
        id: project.id,
        key: project.key,
        name: project.name,
        description: project.description || 'No description available',
        projectTypeKey: project.projectTypeKey,
        lead: project.lead
      }));

      console.log('Processed all projects:', jiraProjects);
      
      // Set all projects
      setProjects(jiraProjects);
    } catch (error) {
      console.error("Failed to fetch all Jira projects:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
      setError(errorMessage);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllJiraProjects();
  }, []);

  return (
    <>
      <PageMeta
        title="All Jira Projects"
        description="Browse all your Jira projects in a table view"
      />
      <PageBreadcrumb pageTitle="All Projects" />
      <div className="space-y-6">
        <ComponentCard title="All Jira Projects">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading projects...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-900">
              <h3 className="text-red-800 font-medium dark:text-red-200">Error loading projects</h3>
              <p className="text-red-700 mt-1 dark:text-red-300">{error}</p>
              <button
                onClick={fetchAllJiraProjects}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No projects found</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                There are no projects available in your Jira instance.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <Table>
                  {/* Table Header */}
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Project Name
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Key
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Type
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Lead
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>

                  {/* Table Body */}
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {project.name}
                          </div>
                          <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                            {project.description || "No description"}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {project.key}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <Badge
                            size="sm"
                            color="primary"
                          >
                            {project.projectTypeKey || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {project.lead || "Unassigned"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <Link
                            to={`/project/${project.key || project.id}`}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            View
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
};

export default AllProjects;