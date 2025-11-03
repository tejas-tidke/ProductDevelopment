import React, { useState, useEffect, useMemo } from 'react';
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
        return issue.key;
      case 'issuetype':
        return issue.fields.issuetype?.name ? (
          <IssueTypeIcon type={issue.fields.issuetype.name} size="sm" />
        ) : 'N/A';
      case 'summary':
        return issue.fields.summary;
      case 'status':
        return issue.fields.status?.name || 'N/A';
      case 'assignee':
        return issue.fields.assignee?.displayName || 'Unassigned';
      case 'reporter':
        return issue.fields.reporter?.displayName || 'N/A';
      case 'created':
        return formatDate(issue.fields.created);
      case 'updated':
        return formatDate(issue.fields.updated);
      case 'priority':
        return issue.fields.priority?.name || 'N/A';
      case 'customfield_10200': // Assignee Custom Field
        // Debugging: log the actual value
        console.log('customfield_10200 value:', issue.fields.customfield_10200);
        return issue.fields.customfield_10200 || 'N/A';
      case 'customfield_10201': // Reporter Custom Field
        // Debugging: log the actual value
        console.log('customfield_10201 value:', issue.fields.customfield_10201);
        return issue.fields.customfield_10201 || 'N/A';
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