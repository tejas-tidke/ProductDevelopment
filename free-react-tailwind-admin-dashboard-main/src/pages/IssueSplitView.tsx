import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import PageMeta from "../components/common/PageMeta";
import { jiraService } from "../services/jiraService";
import { CustomFilterDropdown } from "../components/filters/CustomFilterDropdown";

// Define types
interface Project {
  id: string;
  key: string;
  name: string;
  description: string;
  projectTypeKey: string;
}

interface JiraIssueType {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
}

interface JiraField {
  id: string;
  name: string;
  custom: boolean;
  orderable: boolean;
  navigable: boolean;
  searchable: boolean;
  clauseNames: string[];
}

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
      avatarUrls?: {
        "48x48": string;
      };
    } | null;
    issuetype?: {
      name: string;
      iconUrl?: string;
    };
    status?: {
      name: string;
      statusCategory?: {
        colorName: string;
      };
    };
    priority?: {
      name: string;
      iconUrl?: string;
    };
    resolution?: {
      name: string;
    };
    created?: string;
    updated?: string;
    reporter?: {
      displayName: string;
      avatarUrls?: {
        "48x48": string;
      };
    };
    description?: string;
    customfield_10200?: string;
    customfield_10201?: string;
  };
}

interface Column {
  key: string;
  title: string;
  isSortable: boolean;
  isSelected: boolean;
}

// Comment interface
interface Comment {
  id: string;
  author: {
    displayName: string;
    avatarUrls: {
      "48x48": string;
    };
  };
  body: string;
  created: string;
  updated: string;
}

// History interface
interface HistoryItem {
  id: string;
  author: {
    displayName: string;
    avatarUrls: {
      "48x48": string;
    };
  };
  field: string;
  oldValue: string;
  newValue: string;
  created: string;
}

// Transition interface
interface Transition {
  id: string;
  author: {
    displayName: string;
    avatarUrls: {
      "48x48": string;
    };
  };
  action: string;
  details: string;
  created: string;
}

// Activity interface for combined timeline
interface Activity {
  id: string;
  type: 'comment' | 'history' | 'transition';
  author: {
    displayName: string;
    avatarUrls: {
      "48x48": string;
    };
  };
  created: string;
  data: Comment | HistoryItem | Transition;
}

// Issue Type Icon Component
const IssueTypeIcon: React.FC<{ type: string; size?: 'sm' | 'md' | 'lg' }> = ({ type, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8'
  };

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

  const config = issueTypeConfig[type] || issueTypeConfig['default'];

  return (
    <div className={`${config.bgColor} ${config.color} rounded-lg flex items-center justify-center ${sizeClasses[size]}`}>
      <svg className={`${sizeClasses[size]}`} viewBox="0 0 24 24" fill="currentColor">
        <path d={config.icon} />
      </svg>
    </div>
  );
};

const IssuesSplitView: React.FC = () => {
  const { issueKey } = useParams<{ issueKey: string }>();
  const navigate = useNavigate();

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [selectedIssueType, setSelectedIssueType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // State for data
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for dropdown options
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>([]);
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);
  const [customFields, setCustomFields] = useState<JiraField[]>([]);

  // State for UI elements
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'comments' | 'history' | 'transitions'>('all');
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [selectedStatusDetail, setSelectedStatusDetail] = useState<string>('');

  // State for resizable split view
  const [leftPanelWidth, setLeftPanelWidth] = useState(40); // Percentage width of left panel
  const [isResizing, setIsResizing] = useState(false);
  const splitViewRef = useRef<HTMLDivElement>(null);
  
  // Handle mouse down on the resize handle
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };
  
  // Handle mouse move during resizing
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !splitViewRef.current) return;
    
    const splitViewRect = splitViewRef.current.getBoundingClientRect();
    const containerWidth = splitViewRect.width;
    const mouseX = e.clientX - splitViewRect.left;
    
    // Calculate new width percentage (min 20%, max 80%)
    const newWidth = Math.max(20, Math.min(80, (mouseX / containerWidth) * 100));
    setLeftPanelWidth(newWidth);
  };
  
  // Handle mouse up to stop resizing
  const handleMouseUp = () => {
    setIsResizing(false);
  };
  
  // Add event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleSortChange = (fieldId: string, direction: 'asc' | 'desc') => {
    setSortField(fieldId);
    setSortDirection(direction);
  };

  const handleAddFilter = (fieldId: string) => {
    console.log(`Adding filter for field: ${fieldId}`);
  };

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

  // Fetch all issues and dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
       
        const projectsData = await jiraService.getAllProjects();
        const validProjects = projectsData
          .filter((project: Project) => project.id || project.key)
          .map((project: Project) => ({
            id: project.id || project.key,
            key: project.key,
            name: project.name,
            description: project.description || "",
            projectTypeKey: project.projectTypeKey || ""
          }));
        setProjects(validProjects);
       
        const issueTypesData = await jiraService.getIssueTypes();
        const validIssueTypes = issueTypesData
          .filter((type: JiraIssueType) => type.id && type.name)
          .map((type: JiraIssueType) => ({
            id: type.id,
            name: type.name,
            description: type.description || "",
            iconUrl: type.iconUrl || ""
          }));
        setIssueTypes(validIssueTypes);
       
        try {
          const fieldsData: JiraField[] = await jiraService.getFields();
          const customFieldsData = fieldsData.filter(field => field.custom);
          setCustomFields(customFieldsData);
        } catch (err) {
          console.error('Error fetching Jira fields:', err);
        }
       
        const issuesResponse = await jiraService.getAllIssues();
        let allIssues: Issue[] = [];
        if (Array.isArray(issuesResponse)) {
          allIssues = issuesResponse;
        } else if (issuesResponse && Array.isArray(issuesResponse.issues)) {
          allIssues = issuesResponse.issues;
        }
       
        setIssues(allIssues);
       
        const uniqueStatuses = Array.from(
          new Set(allIssues
            .filter((issue: Issue) => issue.fields?.status?.name)
            .map((issue: Issue) => issue.fields?.status?.name || ""))
        )
        .filter((name): name is string => name !== null && name !== undefined && name !== "")
        .map(name => ({ id: name, name }));
        setStatuses(uniqueStatuses);
       
        const uniqueAssignees = Array.from(
          new Set(allIssues
            .filter((issue: Issue) => issue.fields?.assignee?.displayName)
            .map((issue: Issue) => issue.fields?.assignee?.displayName || ""))
        )
        .filter((name): name is string => name !== null && name !== undefined && name !== "")
        .map(name => ({ id: name || "unassigned", name: name || "Unassigned" }));
        setAssignees(uniqueAssignees);

        // Set selected issue if issueKey exists
        if (issueKey) {
          const foundIssue = allIssues.find(issue => issue.key === issueKey) || null;
          setSelectedIssue(foundIssue);
          if (foundIssue) {
            setSelectedStatusDetail(foundIssue.fields.status?.name || '');
            // Initialize empty arrays for real data (to be populated by API calls)
            setComments([]);
            setHistory([]);
            setTransitions([]);

            // Combine all activities into a single timeline sorted by date
            const allActivities: Activity[] = [
              ...comments.map((comment: Comment) => ({
                id: comment.id,
                type: 'comment' as const,
                author: comment.author,
                created: comment.created,
                data: comment
              })),
              ...history.map((historyItem: HistoryItem) => ({
                id: historyItem.id,
                type: 'history' as const,
                author: historyItem.author,
                created: historyItem.created,
                data: historyItem
              })),
              ...transitions.map((transition: Transition) => ({
                id: transition.id,
                type: 'transition' as const,
                author: transition.author,
                created: transition.created,
                data: transition
              }))
            ].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

            setActivities(allActivities);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch issues. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [issueKey]);

  // Filter issues
  const filteredIssues = useMemo(() => {
    let result = issues.filter(issue => {
      return (
        (searchTerm === "" ||
          (issue.fields?.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.key?.toLowerCase().includes(searchTerm.toLowerCase()))) &&
        (selectedProject === "" || issue.fields?.project?.name === selectedProject) &&
        (selectedAssignee === "" || issue.fields?.assignee?.displayName === selectedAssignee) &&
        (selectedIssueType === "" || issue.fields?.issuetype?.name === selectedIssueType) &&
        (selectedStatus === "" || issue.fields?.status?.name === selectedStatus)
      );
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        let aValue: string, bValue: string;
       
        switch (sortField) {
          case 'key':
            aValue = a.key || '';
            bValue = b.key || '';
            break;
          case 'summary':
            aValue = a.fields?.summary || '';
            bValue = b.fields?.summary || '';
            break;
          case 'status':
            aValue = a.fields?.status?.name || '';
            bValue = b.fields?.status?.name || '';
            break;
          default:
            aValue = '';
            bValue = '';
        }

        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return result;
  }, [issues, searchTerm, selectedProject, selectedAssignee, selectedIssueType, selectedStatus, sortField, sortDirection]);

  // Handle issue click
  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setSelectedStatusDetail(issue.fields.status?.name || '');
    navigate(`/issues/${issue.key}`);
  };

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

  // Get status color
  const getStatusColorClass = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case "to do":
      case "open":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "in progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "done":
      case "closed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  // Handle delete issue
  const handleDeleteIssue = () => {
    if (selectedIssue && window.confirm(`Are you sure you want to delete issue ${selectedIssue.key}?`)) {
      // In a real implementation, this would call the backend API to delete the issue
      console.log(`Deleting issue ${selectedIssue.key}`);
      // For now, we'll just navigate back to the issues list
      if (selectedIssue?.fields.project?.key) {
        navigate(`/project/${selectedIssue.fields.project.key}`);
      } else {
        navigate('/issues');
      }
    }
    setIsMoreDropdownOpen(false);
  };

  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    setSelectedStatusDetail(newStatus);
    // In a real implementation, this would call the API to update the status
    console.log(`Changing status to: ${newStatus}`);
  };

  // Handle add comment
  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        author: {
          displayName: 'Current User', // In a real app, this would be the logged-in user
          avatarUrls: { '48x48': 'https://via.placeholder.com/48' }
        },
        body: newComment,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      setIsAddingComment(false);
    }
  };

  // Navigate back to the project issues page
  const goToProjectIssues = () => {
    if (selectedIssue?.fields.project?.key) {
      navigate(`/project/${selectedIssue.fields.project.key}`);
    } else {
      navigate('/issues');
    }
  };

  if (loading) {
    return (
      <>
        <PageMeta title="Issues" description="View all issues" />
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta title="Issues" description="View all issues" />
        <div className="h-screen flex items-center justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong className="font-bold">Error! </strong>
            <span>{error}</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title={selectedIssue ? `${selectedIssue.key} - Issues` : "Issues"} description="View all issues" />
      <div className="h-screen flex flex-col">
        {/* Header with Filters */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Issues</h1>
         
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search issues..."
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
           
            <select
              className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              aria-label="Filter by project"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.name}>{project.name}</option>
              ))}
            </select>
           
            <select
              className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              aria-label="Filter by assignee"
            >
              <option value="">All Assignees</option>
              {assignees.map(assignee => (
                <option key={assignee.id} value={assignee.name}>{assignee.name}</option>
              ))}
            </select>
           
            <select
              className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedIssueType}
              onChange={(e) => setSelectedIssueType(e.target.value)}
              aria-label="Filter by issue type"
            >
              <option value="">All Types</option>
              {issueTypes.map(type => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
           
            <select
              className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status.id} value={status.name}>{status.name}</option>
              ))}
            </select>
           
            <CustomFilterDropdown
              customFields={customFields.map(field => ({ id: field.id, name: field.name }))}
              onSortChange={handleSortChange}
              onAddFilter={handleAddFilter}
            />
          </div>
        </div>

        {/* Split View */}
        <div 
          ref={splitViewRef}
          className="flex flex-1 overflow-hidden relative"
          style={{ cursor: isResizing ? 'col-resize' : 'default' }}
        >
          {/* Left Side - Issues List */}
          <div 
            className="border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-800 relative"
            style={{ width: `${leftPanelWidth}%` }}
          >
            <div className="p-2">
              {filteredIssues.length > 0 ? (
                <div className="space-y-1">
                  {filteredIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => handleIssueClick(issue)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedIssue?.key === issue.key
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {issue.fields.issuetype?.name && (
                          <IssueTypeIcon type={issue.fields.issuetype.name} size="sm" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {issue.key}
                            </span>
                            {issue.fields.status && (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColorClass(issue.fields.status.name)}`}>
                                {issue.fields.status.name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white truncate">
                            {issue.fields.summary || "No summary"}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>{issue.fields.issuetype?.name}</span>
                            {issue.fields.assignee && (
                              <>
                                <span>•</span>
                                <span>{issue.fields.assignee.displayName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No issues found
                </div>
              )}
            </div>
          </div>
          
          {/* Resize Handle */}
          <div
            className="w-2 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 cursor-col-resize flex items-center justify-center transition-colors"
            onMouseDown={handleMouseDown}
            style={{ zIndex: 10 }}
          >
            <div className="w-1 h-8 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          </div>
          
          {/* Right Side - Issue Detail */}
          <div 
            className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900"
            style={{ width: `${100 - leftPanelWidth}%` }}
          >
            {selectedIssue ? (
              <div className="p-6">
                {/* Issue Header - Jira Style */}
                <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    {/* Left side - Issue Type, Key, Summary */}
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Issue Type Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {selectedIssue.fields.issuetype?.name && (
                          <IssueTypeIcon type={selectedIssue.fields.issuetype.name} size="lg" />
                        )}
                      </div>

                      {/* Issue Key and Summary */}
                      <div className="flex-1 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1 mb-2">
                            <button
                              onClick={goToProjectIssues}
                              className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                              aria-label="Go back"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                              </svg>
                            </button>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <Link
                              to={`/project/${selectedIssue.fields.project?.key}`}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {selectedIssue.fields.project?.name}
                            </Link>
                            <span className="text-sm text-gray-500 dark:text-gray-400">/</span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {selectedIssue.key}
                            </span>
                          </div>
                          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white break-words">
                            {selectedIssue.fields.summary}
                          </h1>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Section */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
                  <div className="flex flex-wrap gap-2">
                    {/* Edit Button */}
                    <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      Edit
                    </button>

                    {/* Add Comment Button */}
                    <button
                      onClick={() => {
                        setActiveTab('comments');
                        setIsAddingComment(true);
                        // Scroll to comments section
                        setTimeout(() => {
                          const commentsSection = document.getElementById('activity-section');
                          if (commentsSection) {
                            commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9 8s9 3.582 9 8z"></path>
                      </svg>
                      Comment
                    </button>

                    {/* Assign Button */}
                    <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                      Assign
                    </button>

                    {/* More Dropdown */}
                    <div className="relative more-dropdown">
                      <button
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                        onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
                      >
                        More
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path>
                        </svg>
                      </button>
                      {isMoreDropdownOpen && (
                        <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
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
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <select
                          value={selectedStatusDetail}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-full appearance-none pr-8 ${getStatusColorClass(selectedStatusDetail || selectedIssue.fields.status?.name || '')}`}
                          aria-label="Change issue status"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                          <option value="Blocked">Blocked</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                            {selectedIssue.fields.issuetype?.name && (
                              <IssueTypeIcon type={selectedIssue.fields.issuetype.name} size="sm" />
                            )}
                            <span className="text-gray-900 dark:text-white ml-2">{selectedIssue.fields.issuetype?.name || "None"}</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Priority</h4>
                          <div className="flex items-center">
                            <span className="text-gray-900 dark:text-white">{selectedIssue.fields.priority?.name || "None"}</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Resolution</h4>
                          <div className="flex items-center">
                            <span className="text-gray-900 dark:text-white">{selectedIssue.fields.resolution?.name || "Unresolved"}</span>
                          </div>
                        </div>

                        {/* Custom Fields */}
                        {selectedIssue.fields.customfield_10201 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Custom Reporter</h4>
                            <span className="text-gray-900 dark:text-white">{selectedIssue.fields.customfield_10201}</span>
                          </div>
                        )}

                        {selectedIssue.fields.customfield_10200 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Custom Assignee</h4>
                            <span className="text-gray-900 dark:text-white">{selectedIssue.fields.customfield_10200}</span>
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
                        {selectedIssue.fields.description ? (
                          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {selectedIssue.fields.description}
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
                          <button
                            onClick={() => {
                              // Create a hidden file input element
                              const fileInput = document.createElement('input');
                              fileInput.type = 'file';
                              fileInput.multiple = true;
                              fileInput.style.display = 'none';

                              // Handle file selection
                              fileInput.onchange = (e) => {
                                const files = Array.from((e.target as HTMLInputElement).files || []);
                                console.log('Selected files:', files);
                                // In a real implementation, this would upload the files to the server
                                if (files.length > 0) {
                                  alert(`Selected ${files.length} file(s) for upload. This feature will be implemented with the API.`);
                                }
                                // Clean up
                                document.body.removeChild(fileInput);
                              };

                              // Add to DOM and trigger click
                              document.body.appendChild(fileInput);
                              fileInput.click();
                            }}
                            className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            Add Attachment
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Activity/Comments Section */}
                    <div id="activity-section">
                      <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Activity</h2>
                      </div>

                      {/* Tabs */}
                      <div className="mb-4">
                        <nav className="flex space-x-8" aria-label="Tabs">
                          <button
                            onClick={() => setActiveTab('all')}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                              activeTab === 'all'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                          >
                            All
                          </button>
                          <button
                            onClick={() => setActiveTab('comments')}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                              activeTab === 'comments'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                          >
                            Comments
                          </button>
                          <button
                            onClick={() => setActiveTab('history')}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                              activeTab === 'history'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                          >
                            History
                          </button>
                          <button
                            onClick={() => setActiveTab('transitions')}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                              activeTab === 'transitions'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                          >
                            Transitions
                          </button>
                        </nav>
                      </div>

                      {/* Tab Content */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg">
                        {activeTab === 'all' && (
                          <div className="p-4">
                            {/* Combined Timeline of All Activities */}
                            {activities.length > 0 ? (
                              <div className="space-y-6">
                                {activities.map((activity) => (
                                  <div key={activity.id} className="flex space-x-3">
                                    <div className="flex-shrink-0">
                                      <img
                                        className="w-8 h-8 rounded-full"
                                        src={activity.author.avatarUrls['48x48']}
                                        alt={activity.author.displayName}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                          {activity.author.displayName}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                          {formatDate(activity.created)}
                                        </span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                          activity.type === 'comment'
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                            : activity.type === 'history'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                        }`}>
                                          {activity.type === 'comment' && '💬 Comment'}
                                          {activity.type === 'history' && '📝 History'}
                                          {activity.type === 'transition' && '⚡ Transition'}
                                        </span>
                                      </div>
                                      <div className="mt-1">
                                        {activity.type === 'comment' && (
                                          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                            {(activity.data as Comment).body}
                                          </div>
                                        )}
                                        {activity.type === 'history' && (
                                          <div className="text-sm text-gray-700 dark:text-gray-300">
                                            Changed <strong>{(activity.data as HistoryItem).field}</strong> from "{(activity.data as HistoryItem).oldValue}" to "{(activity.data as HistoryItem).newValue}"
                                          </div>
                                        )}
                                        {activity.type === 'transition' && (
                                          <div className="text-sm text-gray-700 dark:text-gray-300">
                                            <strong>{(activity.data as Transition).action}</strong>: {(activity.data as Transition).details}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <p>No activities yet</p>
                                <p className="text-sm mt-1">Activity timeline will be shown here</p>
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'comments' && (
                          <div className="p-4">
                            {/* Add Comment Form */}
                            {isAddingComment && (
                              <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="mb-3">
                                  <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                                    rows={3}
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => {
                                      setIsAddingComment(false);
                                      setNewComment('');
                                    }}
                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            )}

                            {comments.length > 0 ? (
                              <div className="space-y-4">
                                {comments.map((comment) => (
                                  <div key={comment.id} className="flex space-x-3">
                                    <div className="flex-shrink-0">
                                      <img
                                        className="w-8 h-8 rounded-full"
                                        src={comment.author.avatarUrls['48x48']}
                                        alt={comment.author.displayName}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                          {comment.author.displayName}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                          {formatDate(comment.created)}
                                        </span>
                                      </div>
                                      <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {comment.body}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                No comments yet
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'history' && (
                          <div className="p-4">
                            {history.length > 0 ? (
                              <div className="space-y-4">
                                {history.map((historyItem) => (
                                  <div key={historyItem.id} className="flex space-x-3">
                                    <div className="flex-shrink-0">
                                      <img
                                        className="w-8 h-8 rounded-full"
                                        src={historyItem.author.avatarUrls['48x48']}
                                        alt={historyItem.author.displayName}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                          {historyItem.author.displayName}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                          {formatDate(historyItem.created)}
                                        </span>
                                      </div>
                                      <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                        Changed <strong>{historyItem.field}</strong> from "{historyItem.oldValue}" to "{historyItem.newValue}"
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <p>No history available</p>
                                <p className="text-sm mt-1">Issue history will be shown here</p>
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'transitions' && (
                          <div className="p-4">
                            {transitions.length > 0 ? (
                              <div className="space-y-4">
                                {transitions.map((transition) => (
                                  <div key={transition.id} className="flex space-x-3">
                                    <div className="flex-shrink-0">
                                      <img
                                        className="w-8 h-8 rounded-full"
                                        src={transition.author.avatarUrls['48x48']}
                                        alt={transition.author.displayName}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                          {transition.author.displayName}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                          {formatDate(transition.created)}
                                        </span>
                                      </div>
                                      <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                        <strong>{transition.action}</strong>: {transition.details}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                </svg>
                                <p>No transitions available</p>
                                <p className="text-sm mt-1">Issue transitions will be shown here</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - People and Dates */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* People Section */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">People</h3>

                      <div className="space-y-4">
                        {/* Assignee */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Assignee</h4>
                          {selectedIssue.fields.assignee ? (
                            <div className="flex items-center space-x-2">
                              <img
                                className="w-6 h-6 rounded-full"
                                src={selectedIssue.fields.assignee.avatarUrls?.['48x48'] || 'https://via.placeholder.com/48'}
                                alt={selectedIssue.fields.assignee.displayName}
                              />
                              <span className="text-sm text-gray-900 dark:text-white">{selectedIssue.fields.assignee.displayName}</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">Unassigned</span>
                            </div>
                          )}
                        </div>

                        {/* Reporter */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Reporter</h4>
                          {selectedIssue.fields.reporter ? (
                            <div className="flex items-center space-x-2">
                              <img
                                className="w-6 h-6 rounded-full"
                                src={selectedIssue.fields.reporter.avatarUrls?.['48x48'] || 'https://via.placeholder.com/48'}
                                alt={selectedIssue.fields.reporter.displayName}
                              />
                              <span className="text-sm text-gray-900 dark:text-white">{selectedIssue.fields.reporter.displayName}</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">Unknown</span>
                            </div>
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
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Created</h4>
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span className="text-sm text-gray-900 dark:text-white">{formatDate(selectedIssue.fields.created)}</span>
                          </div>
                        </div>

                        {/* Updated */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Updated</h4>
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                            <span className="text-sm text-gray-900 dark:text-white">{formatDate(selectedIssue.fields.updated)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p className="text-lg">Select an issue to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default IssuesSplitView;