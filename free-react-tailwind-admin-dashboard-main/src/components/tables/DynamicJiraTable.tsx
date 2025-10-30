import React from 'react';
import { useJiraTable } from '../../hooks/useJiraTable';
import { JiraIssue, TableColumn } from '../../hooks/useJiraTable';

interface DynamicJiraTableProps {
  data: JiraIssue[];
  isLoading?: boolean;
  visibleColumns?: TableColumn[];
  onSort?: (columnKey: string) => void;
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
}

const DynamicJiraTable: React.FC<DynamicJiraTableProps> = ({ 
  data, 
  isLoading = false,
  visibleColumns: externalVisibleColumns,
  onSort,
  sortConfig: externalSortConfig
}) => {
  // Use external props if provided, otherwise use hook
  const hookResult = useJiraTable(data);
  const visibleColumns = externalVisibleColumns || hookResult.visibleColumns;
  const sortConfig = externalSortConfig !== undefined ? externalSortConfig : hookResult.sortConfig;
  const requestSort = onSort || hookResult.requestSort;
  
  // Handle sort callback
  const onSortCallback = (columnKey: string) => {
    requestSort(columnKey);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Render empty state
  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-32">
        <p className="text-gray-500">No issues found</p>
      </div>
    );
  }
  
  // Transform data for table display
  const tableData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;
    
    // Get values for comparison
    let aValue: string | undefined;
    let bValue: string | undefined;
    
    switch (sortConfig.key) {
      case 'key':
        aValue = a.key;
        bValue = b.key;
        break;
      case 'summary':
        aValue = a.fields?.summary;
        bValue = b.fields?.summary;
        break;
      case 'issuetype':
        aValue = a.fields?.issuetype?.name;
        bValue = b.fields?.issuetype?.name;
        break;
      case 'status':
        aValue = a.fields?.status?.name;
        bValue = b.fields?.status?.name;
        break;
      case 'priority':
        aValue = a.fields?.priority?.name;
        bValue = b.fields?.priority?.name;
        break;
      case 'assignee':
        aValue = a.fields?.assignee?.displayName;
        bValue = b.fields?.assignee?.displayName;
        break;
      case 'created':
        aValue = a.fields?.created;
        bValue = b.fields?.created;
        break;
      default:
        aValue = '';
        bValue = '';
    }
    
    // Handle undefined values
    if (aValue === undefined) aValue = '';
    if (bValue === undefined) bValue = '';
    
    // Compare values
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 border-b border-gray-200 dark:border-gray-700">
          <tr>
            {visibleColumns.map((column) => (
              <th 
                key={column.key}
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 last:border-r-0 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => column.isSortable && onSortCallback(column.key)}
              >
                <div className="flex items-center">
                  <span>{column.header}</span>
                  {column.isSortable && sortConfig?.key === column.key && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800">
          {tableData.map((issue) => (
            <tr 
              key={issue.id} 
              className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
            >
              {visibleColumns.map((column) => (
                <td 
                  key={column.key} 
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                >
                  {column.key === 'key' && (
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {issue.key || 'N/A'}
                    </span>
                  )}
                  {column.key === 'summary' && (
                    <span>{issue.fields?.summary || 'No summary'}</span>
                  )}
                  {column.key === 'issuetype' && (
                    <span>{issue.fields?.issuetype?.name || 'Unknown'}</span>
                  )}
                  {column.key === 'status' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      {issue.fields?.status?.name || 'Unknown'}
                    </span>
                  )}
                  {column.key === 'priority' && (
                    <span>{issue.fields?.priority?.name || 'Unknown'}</span>
                  )}
                  {column.key === 'assignee' && (
                    <span>{issue.fields?.assignee?.displayName || 'Unassigned'}</span>
                  )}
                  {column.key === 'created' && (
                    <span>
                      {issue.fields?.created ? new Date(issue.fields.created).toLocaleDateString() : 'N/A'}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DynamicJiraTable;