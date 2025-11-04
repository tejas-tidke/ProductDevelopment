import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import PageMeta from "../components/common/PageMeta";
import { jiraService } from "../services/jiraService";

// Define types for issue data
interface Issue {
  id: string;
  key: string;
  fields: {
    summary?: string;
    project?: {
      name: string;
      key: string;
    };
    assignee?: {
      displayName: string;
      avatarUrls: {
        "48x48": string;
      };
    } | null;
    issuetype?: {
      name: string;
      iconUrl: string;
    };
    status?: {
      name: string;
      statusCategory: {
        colorName: string;
      };
    };
    priority?: {
      name: string;
      iconUrl: string;
    };
    created?: string;
    updated?: string;
    reporter?: {
      displayName: string;
      avatarUrls: {
        "48x48": string;
      };
    };
    description?: string;
    customfield_10200?: string; // Assignee custom field
    customfield_10201?: string; // Reporter custom field
  };
}

// Simple Issue Type Icon Component
const IssueTypeIcon: React.FC<{ type: string; size?: 'sm' | 'md' | 'lg' }> = ({ type, size = 'md' }) => {
  // Define icon sizes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8'
  };
  
  // Define colors and icons for different issue types (matching Jira's color scheme)
  const issueTypeConfig: Record<string, { color: string; bgColor: string; icon: string }> = {
    'Task': {
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z'
    },
    'Bug': {
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 14h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z'
    },
    'Story': {
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z'
    },
    'Epic': {
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-8 8z'
    },
    'Sub-task': {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'
    },
    'Subtask': {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'
    },
    'default': {
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
    }
  };
  
  // Get configuration for the issue type or use default
  const config = issueTypeConfig[type] || issueTypeConfig['default'];
  
  return (
    <div className={`${config.bgColor} ${config.color} rounded-lg flex items-center justify-center ${sizeClasses[size]}`}>
      <svg 
        className={`${sizeClasses[size]}`} 
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d={config.icon} />
      </svg>
    </div>
  );
};

const IssueDetail: React.FC = () => {
  const { issueKey } = useParams<{ issueKey: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMoreDropdownOpen && !(event.target as Element).closest('.more-dropdown')) {
        setIsMoreDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreDropdownOpen]);

  // Handle delete issue
  const handleDeleteIssue = () => {
    if (window.confirm(`Are you sure you want to delete issue ${issueKey}?`)) {
      // In a real implementation, this would call the backend API to delete the issue
      console.log(`Deleting issue ${issueKey}`);
      // For now, we'll just navigate back to the issues list
      if (issue?.fields.project?.key) {
        navigate(`/project/${issue.fields.project.key}`);
      } else {
        navigate('/issues');
      }
    }
    setIsMoreDropdownOpen(false);
  };

  // Fetch issue data
  useEffect(() => {
    const fetchIssue = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all issues and find the one with the matching key
        const issuesResponse = await jiraService.getAllIssues();
        
        // Handle the simplified Jira API response structure (just the issues array)
        let allIssues: Issue[] = [];
        if (Array.isArray(issuesResponse)) {
          // Simplified response - direct array of issues
          allIssues = issuesResponse;
        } else if (issuesResponse && Array.isArray(issuesResponse.issues)) {
          // Standard Jira API response structure
          allIssues = issuesResponse.issues;
        } else {
          // Unexpected structure
          console.warn("Unexpected issues response structure:", issuesResponse);
          allIssues = [];
        }
        
        // Find the issue with the matching key
        const foundIssue = allIssues.find(issue => issue.key === issueKey) || null;
        
        if (foundIssue) {
          setIssue(foundIssue);
        } else {
          setError("Issue not found");
        }
      } catch (err) {
        console.error("Error fetching issue:", err);
        setError("Failed to fetch issue details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (issueKey) {
      fetchIssue();
    }
  }, [issueKey]);

  if (loading) {
    return (
      <>
        <PageMeta title={`Issue ${issueKey}`} description="View issue details" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta title={`Issue ${issueKey}`} description="View issue details" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error! </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!issue) {
    return (
      <>
        <PageMeta title={`Issue ${issueKey}`} description="View issue details" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-center text-gray-500 dark:text-gray-400">
              Issue not found
            </div>
          </div>
        </div>
      </>
    );
  }

  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Get status color class
  const getStatusColorClass = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case "to do":
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in progress":
        return "bg-yellow-100 text-yellow-800";
      case "done":
      case "closed":
        return "bg-green-100 text-green-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Navigate back to the project issues page
  const goToProjectIssues = () => {
    if (issue.fields.project?.key) {
      navigate(`/project/${issue.fields.project.key}`);
    } else {
      navigate('/issues');
    }
  };

  return (
    <>
      <PageMeta title={`Issue ${issue.key} - ${issue.fields.summary}`} description="View issue details" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {/* Back Button */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <button
                onClick={goToProjectIssues}
                className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                aria-label="Go back"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              {issue.fields.project?.key ? (
                <Link 
                  to={`/project/${issue.fields.project.key}`} 
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {issue.fields.project?.name} ({issue.fields.project?.key})
                </Link>
              ) : (
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {issue.fields.project?.name || 'Issues'}
                </span>
              )}
            </div>
          </div>

          {/* Issue Header - Jira Style */}
          <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-start">
              {/* Issue Type Icon */}
              <div className="mb-4 md:mb-0 md:mr-4">
                {issue.fields.issuetype?.name && (
                  <IssueTypeIcon type={issue.fields.issuetype.name} size="lg" />
                )}
              </div>
              
              {/* Issue Key and Summary */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {issue.key}
                    </h1>
                    <h2 className="text-xl mt-1 text-gray-800 dark:text-gray-200">
                      {issue.fields.summary}
                    </h2>
                  </div>
                  <div className="mt-2 md:mt-0">
                    {issue.fields.status && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColorClass(issue.fields.status.name)}`}>
                        {issue.fields.status.name}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {/* Edit Button */}
                  <button className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Edit
                  </button>
                  
                  {/* Add Comment Button */}
                  <button className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9 8s9 3.582 9 8z"></path>
                    </svg>
                    Add Comment
                  </button>
                  
                  {/* Assign Button */}
                  <button className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    Assign
                  </button>
                  
                  {/* More Dropdown */}
                  <div className="relative more-dropdown">
                    <button 
                      className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path>
                      </svg>
                      More
                    </button>
                    {isMoreDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                        <div className="py-1">
                          <button
                            onClick={handleDeleteIssue}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Status Dropdown */}
                  <div className="relative">
                    <select 
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
                      aria-label="Change issue status"
                    >
                      <option>{issue.fields.status?.name || "Select Status"}</option>
                      <option>To Do</option>
                      <option>In Progress</option>
                      <option>Done</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Left Column - Details and Description */}
            <div className="lg:col-span-2">
              {/* Details Section */}
              <div className="mb-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Issue Type</h4>
                    <div className="flex items-center">
                      {issue.fields.issuetype?.name && (
                        <IssueTypeIcon type={issue.fields.issuetype.name} size="sm" />
                      )}
                      <span className="text-gray-900 dark:text-white ml-2">{issue.fields.issuetype?.name || "None"}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Priority</h4>
                    <div className="flex items-center">
                      <span className="text-gray-900 dark:text-white">{issue.fields.priority?.name || "None"}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status</h4>
                    <div className="flex items-center">
                      <span className="text-gray-900 dark:text-white">{issue.fields.status?.name || "None"}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Project</h4>
                    <span className="text-gray-900 dark:text-white">{issue.fields.project?.name || "Unknown"}</span>
                  </div>

                  {/* Custom Fields */}
                  {issue.fields.customfield_10200 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Custom Assignee</h4>
                      <span className="text-gray-900 dark:text-white">{issue.fields.customfield_10200}</span>
                    </div>
                  )}

                  {issue.fields.customfield_10201 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Custom Reporter</h4>
                      <span className="text-gray-900 dark:text-white">{issue.fields.customfield_10201}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Description</h2>
                </div>
                <div className="prose max-w-none">
                  {issue.fields.description ? (
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {issue.fields.description}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">No description provided</p>
                  )}
                </div>
              </div>

              {/* Attachments Section */}
              <div className="mb-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                    </svg>
                    Attachments
                  </h2>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                    </svg>
                    <p className="mt-2">No attachments yet</p>
                    <button className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Add Attachment
                    </button>
                  </div>
                </div>
              </div>

              {/* Activity/Comments Section */}
              <div>
                <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Activity</h2>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No activity yet
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - People and Dates */}
            <div className="lg:col-span-1">
              {/* People Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">People</h3>
                
                <div className="space-y-4">
                  {/* Assignee */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Assignee</h4>
                    {issue.fields.assignee ? (
                      <div className="flex items-center">
                        <span className="text-gray-900 dark:text-white">{issue.fields.assignee.displayName}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">Unassigned</span>
                    )}
                  </div>

                  {/* Reporter */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Reporter</h4>
                    {issue.fields.reporter ? (
                      <div className="flex items-center">
                        <span className="text-gray-900 dark:text-white">{issue.fields.reporter.displayName}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">Unknown</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">Dates</h3>
                
                <div className="space-y-4">
                  {/* Created */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Created</h4>
                    <span className="text-gray-900 dark:text-white">{formatDate(issue.fields.created)}</span>
                  </div>

                  {/* Updated */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Updated</h4>
                    <span className="text-gray-900 dark:text-white">{formatDate(issue.fields.updated)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IssueDetail;