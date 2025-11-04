import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { jiraService } from '../../services/jiraService';
import JiraTablePagination from './JiraTablePagination';
import ColumnSelector from './ColumnSelector';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import IssueTypeIcon from './IssueTypeIcon';

interface Column {
  key: string;
  title: string;
  isSortable: boolean;
  isSelected: boolean;
}

interface Issue {
  id: string;
  key: string;
  fields: {
    issuetype: {
      name: string;
    };
    summary: string;
    status: {
      name: string;
    };
    assignee?: {
      displayName: string;
    };
    reporter: {
      displayName: string;
    };
    created: string;
    updated: string;
    priority: {
      name: string;
    };
    // Custom fields
    customfield_10200?: string;
    customfield_10201?: string;
  };
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

interface DynamicJiraTableProps {
  projectKey: string;
}

const DynamicJiraTable: React.FC<DynamicJiraTableProps> = ({ projectKey }) => {
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
    { key: 'actions', title: 'Actions', isSortable: false, isSelected: true }, // Add Actions column
  ]);
  
  const [tableData, setTableData] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalIssues, setTotalIssues] = useState(0);

  // Fetch Jira fields when component mounts or projectKey changes
  useEffect(() => {
    const fetchJiraFields = async () => {
      if (!projectKey) return;
      
      try {
        const fields: JiraField[] = await jiraService.getFields();
        
        // Update columns based on Jira fields
        const updatedColumns = fields
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
    };

    fetchJiraFields();
  }, [projectKey]);

  // Fetch issues when component mounts or projectKey changes
  useEffect(() => {
    fetchIssues();
  }, [projectKey, currentPage, itemsPerPage]);

  // Listen for issueCreated event to refresh the table
  useEffect(() => {
    const handleIssueCreated = () => {
      // Reset to first page and fetch issues
      setCurrentPage(1);
      fetchIssues();
    };

    window.addEventListener('issueCreated', handleIssueCreated);
    
    return () => {
      window.removeEventListener('issueCreated', handleIssueCreated);
    };
  }, [projectKey]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch issues for the project
      const response = await jiraService.getIssuesForProject(projectKey);
      
      // Extract issues from response
      const issues = response.issues || [];
      setTableData(issues);
      setTotalIssues(response.total || issues.length);
    } catch (err) {
      console.error('Error fetching issues:', err);
      setError('Failed to fetch issues. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleColumn = (columnKey: string) => {
    setAllColumns(prevColumns => 
      prevColumns.map(column => 
        column.key === columnKey 
          ? { ...column, isSelected: !column.isSelected } 
          : column
      )
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  const getCellValue = (issue: Issue, columnKey: string): React.ReactNode => {
    switch (columnKey) {
      case 'key':
        return (
          <Link 
            to={`/issues/${issue.key}`} 
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {issue.key || 'N/A'}
          </Link>
        );
      case 'issuetype':
        return (
          <div className="flex items-center">
            <IssueTypeIcon type={issue.fields.issuetype?.name || 'Task'} />
          </div>
        );
      case 'summary':
        return (
          <Link 
            to={`/issues/${issue.key}`} 
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {issue.fields.summary || 'No summary'}
          </Link>
        );
      case 'status':
        return issue.fields.status?.name || 'Unknown';
      case 'assignee':
        return issue.fields.assignee?.displayName || 'Unassigned';
      case 'reporter':
        return issue.fields.reporter?.displayName || 'Unknown';
      case 'created':
        return formatDate(issue.fields.created);
      case 'updated':
        return formatDate(issue.fields.updated);
      case 'priority':
        return issue.fields.priority?.name || 'Unknown';
      case 'customfield_10200':
        console.log('customfield_10200 value:', issue.fields.customfield_10200);
        return issue.fields.customfield_10200 || 'N/A';
      case 'customfield_10201':
        console.log('customfield_10201 value:', issue.fields.customfield_10201);
        return issue.fields.customfield_10201 || 'N/A';
      case 'actions':
        return <ActionsDropdown issue={issue} />;
      default: {
        // For custom fields, try to get the value from the fields object
        const fieldValue = issue.fields[columnKey as keyof typeof issue.fields];
        if (typeof fieldValue === 'string') {
          return fieldValue;
        } else if (fieldValue && typeof fieldValue === 'object' && 'name' in fieldValue) {
          return (fieldValue as { name: string }).name;
        } else if (fieldValue && typeof fieldValue === 'object' && 'displayName' in fieldValue) {
          return (fieldValue as { displayName: string }).displayName;
        } else {
          return 'N/A';
        }
      }
    }
  };

  // Actions dropdown component
  const ActionsDropdown: React.FC<{ issue: Issue }> = ({ issue }) => {
    const [isOpen, setIsOpen] = useState(false);
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
      window.location.href = `/#/issues/${issue.key}`;
      closeDropdown();
    };

    // Handle edit issue
    const handleEditIssue = () => {
      // For now, we'll just navigate to the issue detail page
      // In a full implementation, you would open an edit modal
      window.location.href = `/#/issues/${issue.key}`;
      closeDropdown();
    };

    // Handle delete issue
    const handleDeleteIssue = async () => {
      if (window.confirm(`Are you sure you want to delete issue ${issue.key}?`)) {
        try {
          // In a full implementation, you would call the delete API
          console.log(`Deleting issue ${issue.key}`);
          // After deletion, you would refresh the issues list
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

  // Handle column reordering
  const handleColumnReorder = (newOrder: Column[]) => {
    setAllColumns(newOrder);
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

  // Get visible columns based on isSelected flag
  const visibleColumns = useMemo(() => {
    return allColumns.filter(column => column.isSelected);
  }, [allColumns]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error! </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  const totalPages = Math.ceil(totalIssues / itemsPerPage);

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        {/* Column Selector */}
        <div className="mb-4 flex justify-end">
          <ColumnSelector 
            columns={allColumns} 
            onColumnToggle={toggleColumn} 
            projectKey={projectKey}
            onColumnReorder={handleColumnReorder}
          />
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {visibleColumns.map((column, index) => (
                  <DraggableHeader 
                    key={`header-${column.key}`}
                    column={column}
                    index={index}
                    onSort={handleSort}
                    sortConfig={sortConfig}
                    onMove={handleColumnMove}
                  />
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
              {tableData.map((issue) => (
                <tr 
                  key={`row-${issue.id}`} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                >
                  {visibleColumns.map((column) => (
                    <td 
                      key={`cell-${issue.id}-${column.key}`} 
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                    >
                      {getCellValue(issue, column.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <JiraTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={totalIssues}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>
    </DndProvider>
  );
};

export default DynamicJiraTable;