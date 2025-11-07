import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useDrag, useDrop } from "react-dnd";
import PageMeta from "../components/common/PageMeta";
import { jiraService, IssueData, IssueUpdateData } from "../services/jiraService";
import EditIssueModal from "../components/modals/EditIssueModal";
import CreateIssueModal from "../components/modals/CreateIssueModal";
import { CustomFilterDropdown } from "../components/filters/CustomFilterDropdown";
import ColumnSelector from "../components/tables/ColumnSelector";

// Define types based on actual Jira API response
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

// Define the issue structure for the table
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
    } | null;
    issuetype?: {
      name: string;
    };
    status?: {
      name: string;
    };
    priority?: {
      name: string;
    };
    created?: string;
    updated?: string;
    reporter?: {
      displayName: string;
    };
    customfield_10200?: string; // Assignee custom field
    customfield_10201?: string; // Reporter custom field
  };
}

interface Column {
  key: string;
  title: string;
  isSortable: boolean;
  isSelected: boolean;
}

const Issues: React.FC = () => {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for dropdown options
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>([]);
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);
  const [customFields, setCustomFields] = useState<JiraField[]>([]);
  
  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<{
    id: string;
    key: string;
    fields: {
      summary?: string;
      project?: {
        key: string;
      };
      description?: string;
      duedate?: string;
      issuetype?: {
        name: string;
      };
      customfield_10200?: string;
    };
  } | null>(null);
  
  // State for column visibility
  const [allColumns, setAllColumns] = useState<Column[]>([
    { key: 'key', title: 'Key', isSortable: true, isSelected: true },
    { key: 'issuetype', title: 'Type', isSortable: true, isSelected: true },
    { key: 'summary', title: 'Summary', isSortable: true, isSelected: true },
    { key: 'status', title: 'Status', isSortable: true, isSelected: true },
    { key: 'assignee', title: 'Assignee', isSortable: true, isSelected: true },
    { key: 'reporter', title: 'Reporter', isSortable: true, isSelected: true },
    { key: 'customfield_10200', title: 'Assignee (Custom)', isSortable: true, isSelected: true },
    { key: 'customfield_10201', title: 'Reporter (Custom)', isSortable: true, isSelected: true },
    { key: 'created', title: 'Created', isSortable: true, isSelected: false },
    { key: 'updated', title: 'Updated', isSortable: true, isSelected: false },
    { key: 'priority', title: 'Priority', isSortable: true, isSelected: true },
    { key: 'project', title: 'Project', isSortable: true, isSelected: true },
    { key: 'actions', title: 'Actions', isSortable: false, isSelected: true }, // Add Actions column
  ]);

  // Toggle column visibility
  const toggleColumn = (columnKey: string) => {
    setAllColumns(prevColumns => 
      prevColumns.map(column => 
        column.key === columnKey 
          ? { ...column, isSelected: !column.isSelected } 
          : column
      )
    );
  };

  // Get visible columns based on isSelected flag
  const visibleColumns = allColumns.filter(column => column.isSelected);

  // Handle sort change from custom filter dropdown
  const handleSortChange = (fieldId: string, direction: 'asc' | 'desc') => {
    setSortField(fieldId);
    setSortDirection(direction);
  };

  // Handle column move (for drag and drop)
  const handleColumnMove = (dragIndex: number, hoverIndex: number) => {
    // Get currently visible columns
    const visibleCols = allColumns.filter(col => col.isSelected);
    
    // Create a copy of the visible columns array
    const newOrder = [...visibleCols];
    
    // Remove the dragged item
    const [draggedItem] = newOrder.splice(dragIndex, 1);
    
    // Insert the dragged item at the new position
    newOrder.splice(hoverIndex, 0, draggedItem);
    
    // Update the order of visible columns in the main array
    let visibleColIndex = 0;
    const reorderedColumns = allColumns.map(col => {
      if (col.isSelected) {
        const updatedCol = newOrder[visibleColIndex];
        visibleColIndex++;
        return updatedCol;
      }
      return col;
    });
    
    setAllColumns(reorderedColumns);
  };

  // Get status color based on status name
  const getStatusColor = (statusName?: string) => {
    if (statusName) {
      const statusNameLower = statusName.toLowerCase();
      if (statusNameLower.includes('done') || statusNameLower.includes('complete')) {
        return 'bg-green-100 text-green-800';
      } else if (statusNameLower.includes('progress') || statusNameLower.includes('in progress')) {
        return 'bg-blue-100 text-blue-800';
      } else if (statusNameLower.includes('review') || statusNameLower.includes('test')) {
        return 'bg-yellow-100 text-yellow-800';
      } else if (statusNameLower.includes('todo') || statusNameLower.includes('to do')) {
        return 'bg-gray-100 text-gray-800';
      } else if (statusNameLower.includes('backlog')) {
        return 'bg-gray-200 text-gray-800';
      } else if (statusNameLower.includes('cancel') || statusNameLower.includes('reject')) {
        return 'bg-red-100 text-red-800';
      }
    }
    
    // Default color
    return 'bg-gray-100 text-gray-800';
  };

  // Handle sort for draggable headers (simplified version)
  const handleSort = (key: string) => {
    // Toggle direction if same key, otherwise default to asc
    let direction: 'asc' | 'desc' = 'asc';
    if (sortField === key && sortDirection === 'asc') {
      direction = 'desc';
    }
    handleSortChange(key, direction);
  };

  // Handle adding a filter from custom filter dropdown
  const handleAddFilter = (fieldId: string) => {
    // For now, we'll just log this - in a full implementation, you would show a filter input
    console.log(`Adding filter for field: ${fieldId}`);
  };

  // Handle edit issue submission
  const handleEditIssueSubmit = async (issueIdOrKey: string, issueData: IssueUpdateData) => {
    try {
      await jiraService.updateIssue(issueIdOrKey, issueData);
      // Refresh the issues list
      const issuesResponse = await jiraService.getAllIssues();
      let allIssues: Issue[] = [];
      if (Array.isArray(issuesResponse)) {
        allIssues = issuesResponse;
      } else if (issuesResponse && Array.isArray(issuesResponse.issues)) {
        allIssues = issuesResponse.issues;
      } else {
        allIssues = [];
      }
      setIssues(allIssues);
      alert('Issue updated successfully');
    } catch (error) {
      console.error('Error updating issue:', error);
      alert('Failed to update issue');
    }
  };

  // Handle create issue submission
  const handleCreateIssueSubmit = async (issueData: IssueData) => {
    try {
      console.log('Submitting issue data to backend:', issueData);
      const createdIssue = await jiraService.createIssue(issueData);
      console.log('Issue created successfully:', createdIssue);
      // Refresh the issues list
      const issuesResponse = await jiraService.getAllIssues();
      let allIssues: Issue[] = [];
      if (Array.isArray(issuesResponse)) {
        allIssues = issuesResponse;
      } else if (issuesResponse && Array.isArray(issuesResponse.issues)) {
        allIssues = issuesResponse.issues;
      } else {
        allIssues = [];
      }
      setIssues(allIssues);
      return createdIssue;
    } catch (error) {
      console.error('Error creating issue:', error);
      if (error instanceof Error) {
        alert(`Failed to create issue: ${error.message}`);
      } else {
        alert('Failed to create issue. Please check your network connection and try again.');
      }
      throw error;
    }
  };

  // Open edit modal with selected issue
  const openEditModal = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsEditModalOpen(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedIssue(null);
  };

  // Close create modal
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  // Fetch all issues and dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all projects for dropdown with error handling
        try {
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
        } catch (err) {
          console.error('Error fetching Jira projects:', err);
          // Use fallback static projects if API call fails
          const staticProjects: Project[] = [
            { id: '1', key: 'CMP', name: 'Company Project', description: 'Default company project', projectTypeKey: 'software' },
            { id: '2', key: 'PROJ', name: 'Sample Project', description: 'Sample project for testing', projectTypeKey: 'software' }
          ];
          setProjects(staticProjects);
          // Don't show error to user for projects as we have fallback
        }
        
        // Fetch issue types for dropdown with error handling
        try {
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
        } catch (err) {
          console.error('Error fetching issue types:', err);
          // Use fallback static issue types if API call fails
          const staticIssueTypes: JiraIssueType[] = [
            { id: '1', name: 'Task', description: 'A task that needs to be done', iconUrl: '' },
            { id: '2', name: 'Bug', description: 'A problem or error', iconUrl: '' },
            { id: '3', name: 'Story', description: 'A user story', iconUrl: '' },
            { id: '4', name: 'Epic', description: 'A large user story', iconUrl: '' },
            { id: '5', name: 'Sub-task', description: 'A sub-task of a story or task', iconUrl: '' }
          ];
          setIssueTypes(staticIssueTypes);
          // Don't show error to user for issue types as we have fallback
        }
        
        // Fetch Jira fields (including custom fields)
        try {
          const fieldsData: JiraField[] = await jiraService.getFields();
          console.log("Jira fields data:", fieldsData);
          
          // Filter for custom fields only
          const customFieldsData = fieldsData.filter(field => field.custom);
          setCustomFields(customFieldsData);
          
          // Update columns based on Jira fields
          const updatedColumns = fieldsData
            .filter((field: JiraField) => field.navigable) // Only include navigable fields
            .map((field: JiraField) => {
              // Check if this field already exists in our columns
              const existingColumn = allColumns.find(col => col.key === field.id);
              return {
                key: field.id,
                title: field.name,
                isSortable: field.orderable,
                isSelected: existingColumn ? existingColumn.isSelected : false
              };
            });
          
          // Merge with existing columns, keeping defaults where they exist
          const mergedColumns = [...allColumns];
          updatedColumns.forEach((updatedCol: Column) => {
            const existingIndex = mergedColumns.findIndex(col => col.key === updatedCol.key);
            if (existingIndex >= 0) {
              // Update existing column
              mergedColumns[existingIndex] = updatedCol;
            } else {
              // Add new column (default to not selected)
              mergedColumns.push({ ...updatedCol, isSelected: false });
            }
          });
          
          setAllColumns(mergedColumns);
        } catch (err) {
          console.error('Error fetching Jira fields:', err);
        }
        
        // Fetch all issues from backend using the new endpoint
        try {
          const issuesResponse = await jiraService.getAllIssues();
          console.log("Raw issues response:", issuesResponse); // Debug log to see the actual structure
          
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
          
          console.log("Processed issues:", allIssues); // Debug log to see the issues structure
          setIssues(allIssues);
          
          // Extract unique statuses from all issues with proper null checking
          const uniqueStatuses = Array.from(
            new Set(allIssues
              .filter((issue: Issue) => issue.fields?.status?.name)
              .map((issue: Issue) => issue.fields?.status?.name || ""))
          )
          .filter((name): name is string => name !== null && name !== undefined && name !== "")
          .map(name => ({ id: name, name }));
          setStatuses(uniqueStatuses);
          
          // Extract unique assignees from all issues with proper null checking
          const uniqueAssignees = Array.from(
            new Set(allIssues
              .filter((issue: Issue) => issue.fields?.assignee?.displayName)
              .map((issue: Issue) => issue.fields?.assignee?.displayName || ""))
          )
          .filter((name): name is string => name !== null && name !== undefined && name !== "")
          .map(name => ({ 
            id: name || "unassigned", 
            name: name || "Unassigned" 
          }));
          setAssignees(uniqueAssignees);
        } catch (err) {
          console.error("Error fetching issues:", err);
          setError("Failed to fetch issues from Jira. Please check your network connection and try again.");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data from Jira. Please check your network connection and try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter issues based on selected filters with proper null checking
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

    // Apply sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        // Get values for comparison
        let aValue: string, bValue: string;
        
        // Handle custom fields
        if (sortField.startsWith('customfield_')) {
          aValue = (a.fields?.[sortField as keyof typeof a.fields] as string) || '';
          bValue = (b.fields?.[sortField as keyof typeof b.fields] as string) || '';
        } else {
          // Handle standard fields
          switch (sortField) {
            case 'key':
              aValue = a.key || '';
              bValue = b.key || '';
              break;
            case 'summary':
              aValue = a.fields?.summary || '';
              bValue = b.fields?.summary || '';
              break;
            case 'issuetype':
              aValue = a.fields?.issuetype?.name || '';
              bValue = b.fields?.issuetype?.name || '';
              break;
            case 'status':
              aValue = a.fields?.status?.name || '';
              bValue = b.fields?.status?.name || '';
              break;
            case 'assignee':
              aValue = a.fields?.assignee?.displayName || '';
              bValue = b.fields?.assignee?.displayName || '';
              break;
            case 'reporter':
              aValue = a.fields?.reporter?.displayName || '';
              bValue = b.fields?.reporter?.displayName || '';
              break;
            case 'created':
              aValue = a.fields?.created || '';
              bValue = b.fields?.created || '';
              break;
            case 'updated':
              aValue = a.fields?.updated || '';
              bValue = b.fields?.updated || '';
              break;
            case 'priority':
              aValue = a.fields?.priority?.name || '';
              bValue = b.fields?.priority?.name || '';
              break;
            case 'project':
              aValue = a.fields?.project?.name || '';
              bValue = b.fields?.project?.name || '';
              break;
            default:
              aValue = '';
              bValue = '';
          }
        }

        // Compare values
        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return result;
  }, [issues, searchTerm, selectedProject, selectedAssignee, selectedIssueType, selectedStatus, sortField, sortDirection]);

  const getCellValue = (issue: Issue, columnKey: string): React.ReactNode => {
    switch (columnKey) {
      case 'key':
        return (
          <Link 
            to={`/issues-split/${issue.key}`} 
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {issue.key || "N/A"}
          </Link>
        );
      case 'issuetype':
        return issue.fields?.issuetype?.name || "Unknown";
      case 'summary':
        return (
          <Link 
            to={`/issues-split/${issue.key}`} 
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {issue.fields?.summary || "No summary"}
          </Link>
        );
      case 'status':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.fields?.status?.name)}`}>
            {issue.fields?.status?.name || "Unknown"}
          </span>
        );
      case 'assignee':
        return issue.fields?.assignee?.displayName || issue.fields?.assignee ? "No name" : "Unassigned";
      case 'reporter':
        return issue.fields?.reporter?.displayName || "Unknown";
      case 'created':
        return issue.fields?.created ? new Date(issue.fields.created).toLocaleDateString() : "Unknown";
      case 'updated':
        return issue.fields?.updated ? new Date(issue.fields.updated).toLocaleDateString() : "Unknown";
      case 'priority':
        return issue.fields?.priority?.name || "Unknown";
      case 'project':
        return issue.fields?.project?.name || "Unknown";
      case 'customfield_10200': // Assignee Custom Field
        return issue.fields?.customfield_10200 || "N/A";
      case 'customfield_10201': // Reporter Custom Field
        return issue.fields?.customfield_10201 || "N/A";
      case 'actions':
        return <ActionsDropdown issue={issue} />;
      default:
        return "N/A";
    }
  };

  // Actions dropdown component
  const ActionsDropdown: React.FC<{ issue: Issue }> = ({ issue }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    // Toggle dropdown
    const toggleDropdown = () => {
      setIsOpen(!isOpen);
    };

    // Close dropdown
    const closeDropdown = () => {
      setIsOpen(false);
    };

    // Handle view issue
    const handleViewIssue = () => {
      navigate(`/issues-split/${issue.key}`);
      closeDropdown();
    };

    // Handle edit issue
    const handleEditIssue = () => {
      openEditModal(issue);
      closeDropdown();
    };

    // Handle delete issue
    const handleDeleteIssue = async () => {
      if (window.confirm(`Are you sure you want to delete issue ${issue.key}?`)) {
        try {
          await jiraService.deleteIssue(issue.key);
          // Refresh the issues list
          const issuesResponse = await jiraService.getAllIssues();
          let allIssues: Issue[] = [];
          if (Array.isArray(issuesResponse)) {
            allIssues = issuesResponse;
          } else if (issuesResponse && Array.isArray(issuesResponse.issues)) {
            allIssues = issuesResponse.issues;
          } else {
            allIssues = [];
          }
          setIssues(allIssues);
          alert('Issue deleted successfully');
        } catch (error) {
          console.error('Error deleting issue:', error);
          alert('Failed to delete issue');
        }
      }
      closeDropdown();
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center"
          aria-label="Actions"
        >
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 transition-all duration-200 ease-out transform origin-top-right">
            <div className="py-1" role="menu">
              <button
                onClick={handleViewIssue}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-none first:rounded-t-md last:rounded-b-md transition-colors duration-150"
                role="menuitem"
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  View Issue
                </div>
              </button>
              <button
                onClick={handleEditIssue}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-none first:rounded-t-md last:rounded-b-md transition-colors duration-150"
                role="menuitem"
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  Edit Issue
                </div>
              </button>
              <button
                onClick={handleDeleteIssue}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700 rounded-none first:rounded-t-md last:rounded-b-md transition-colors duration-150"
                role="menuitem"
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  Delete Issue
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Draggable header component
  const DraggableHeader: React.FC<{
    column: Column;
    index: number;
    onSort: (key: string) => void;
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    onMove: (dragIndex: number, hoverIndex: number) => void;
  }> = ({ column, index, onSort, sortConfig, onMove }) => {
    const ref = React.useRef<HTMLTableHeaderCellElement>(null);
    
    const [{ isDragging }, drag] = useDrag({
      type: 'tableColumn',
      item: { index, column },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });
    
    const [, drop] = useDrop({
      accept: 'tableColumn',
      hover(item: { index: number, column: Column }) {
        if (!ref.current) {
          return;
        }
        
        const dragIndex = item.index;
        const hoverIndex = index;
        
        // Don't replace items with themselves
        if (dragIndex === hoverIndex) {
          return;
        }
        
        // Time to actually perform the action
        onMove(dragIndex, hoverIndex);
        
        // Note: we're mutating the monitor item here!
        // Generally it's better to avoid mutations,
        // but it's good here for the sake of performance
        // to avoid expensive index searches.
        item.index = hoverIndex;
      },
    });

    drag(drop(ref));
    
    return (
      <th 
        ref={ref}
        scope="col" 
        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 last:border-r-0 hover:bg-gray-100 dark:hover:bg-gray-600 ${isDragging ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center">
          <span onClick={(e) => { 
            e.stopPropagation(); 
            if (column.isSortable) {
              onSort(column.key);
            }
          }}>
            {column.title}
            {sortConfig && sortConfig.key === column.key && (
              <span className="ml-1">
                {sortConfig.direction === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </span>
        </div>
      </th>
    );
  };

  if (loading) {
    return (
      <>
        <PageMeta title="Issues" description="View all issues across projects" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Issues
            </h1>
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
        <PageMeta title="Issues" description="View all issues across projects" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Issues
            </h1>
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error! </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Issues" description="View all issues across projects" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Issues
          </h1>
          
          {/* Edit Issue Modal */}
          {selectedIssue && (
            <EditIssueModal
              isOpen={isEditModalOpen}
              onClose={closeEditModal}
              onSubmit={handleEditIssueSubmit}
              issue={selectedIssue}
            />
          )}
          
          {/* Create Issue Modal */}
          <CreateIssueModal
            isOpen={isCreateModalOpen}
            onClose={closeCreateModal}
            onSubmit={handleCreateIssueSubmit}
            onIssueCreated={async (createdIssue, attachments) => {
              // Handle any post-creation logic here if needed
              console.log('Issue created with attachments:', createdIssue, attachments);
            }}
          />
          
          {/* Filters Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4 mb-6">
            {/* Search Box */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search issues..."
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search issues"
              />
            </div>
            
            {/* Project Dropdown */}
            <div>
              <select
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                aria-label="Filter by project"
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project.id || project.key} value={project.name}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Assignee Dropdown */}
            <div>
              <select
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                aria-label="Filter by assignee"
              >
                <option value="">All Assignees</option>
                {assignees.map(assignee => (
                  <option key={assignee.id} value={assignee.name}>
                    {assignee.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Issue Type Dropdown */}
            <div>
              <select
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={selectedIssueType}
                onChange={(e) => setSelectedIssueType(e.target.value)}
                aria-label="Filter by issue type"
              >
                <option value="">All Types</option>
                {issueTypes.map(type => (
                  <option key={type.id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Status Dropdown */}
            <div>
              <select
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status.id} value={status.name}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Custom Filter Dropdown */}
            <div>
              <CustomFilterDropdown
                customFields={customFields.map(field => ({ id: field.id, name: field.name }))}
                onSortChange={handleSortChange}
                onAddFilter={handleAddFilter}
              />
            </div>
            
            {/* Column Selector - Moved to the right */}
            <div>
              <ColumnSelector 
                columns={allColumns} 
                onColumnToggle={toggleColumn} 
                projectKey="" // Empty project key for all issues
              />
            </div>
          </div>
          
          {/* Issues Table */}
          <DndProvider backend={HTML5Backend}>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                    <tr>
                      {visibleColumns.map((column, index) => (
                        <DraggableHeader 
                          key={`header-${column.key}`}
                          column={column}
                          index={index}
                          onSort={handleSort}
                          sortConfig={sortField ? { key: sortField, direction: sortDirection } : null}
                          onMove={handleColumnMove}
                        />
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {filteredIssues.length > 0 ? (
                      filteredIssues.map((issue) => (
                        <tr key={`row-${issue.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          {visibleColumns.map((column) => (
                            <td 
                              key={`cell-${issue.id}-${column.key}`} 
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                            >
                              {getCellValue(issue, column.key)}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={visibleColumns.length} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No issues found matching the selected filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </DndProvider>
          
          {/* Results count */}
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredIssues.length} of {issues.length} issues
          </div>
        </div>
      </div>
    </>
  );
};

export default Issues;