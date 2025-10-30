import { useState, useCallback, useMemo } from 'react';

// Define types for our table data - matching the ProjectDetail interface
export interface JiraIssue {
  id: string;
  key: string;
  fields?: {
    summary?: string;
    description?: string;
    summaryText?: string;
    status?: {
      name?: string;
      statusCategory?: {
        name?: string;
      };
    };
    issuetype?: {
      name?: string;
      description?: string;
    };
    priority?: {
      name?: string;
    };
    assignee?: {
      displayName?: string;
      name?: string;
      emailAddress?: string;
    };
    created?: string;
  };
}

export interface TableColumn {
  key: string;
  header: string;
  isSortable: boolean;
  isSelected: boolean;
}

// Define available columns
const DEFAULT_COLUMNS: TableColumn[] = [
  { key: 'key', header: 'Key', isSortable: true, isSelected: true },
  { key: 'summary', header: 'Summary', isSortable: true, isSelected: true },
  { key: 'issuetype', header: 'Issue Type', isSortable: true, isSelected: true },
  { key: 'status', header: 'Status', isSortable: true, isSelected: true },
  { key: 'priority', header: 'Priority', isSortable: true, isSelected: true },
  { key: 'assignee', header: 'Assignee', isSortable: true, isSelected: true },
  { key: 'created', header: 'Created', isSortable: true, isSelected: false },
];

export const useJiraTable = (initialData: JiraIssue[] = []) => {
  // State for table data
  const [data, setData] = useState<JiraIssue[]>(initialData);
  
  // State for columns
  const [columns, setColumns] = useState<TableColumn[]>(DEFAULT_COLUMNS);
  
  // State for sorting
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Get visible columns
  const visibleColumns = useMemo(() => {
    return columns.filter(column => column.isSelected);
  }, [columns]);
  
  // Toggle column visibility
  const toggleColumn = useCallback((columnKey: string) => {
    setColumns(prevColumns => 
      prevColumns.map(column => 
        column.key === columnKey 
          ? { ...column, isSelected: !column.isSelected } 
          : column
      )
    );
  }, []);
  
  // Select all columns
  const selectAllColumns = useCallback(() => {
    setColumns(prevColumns => 
      prevColumns.map(column => ({ ...column, isSelected: true }))
    );
  }, []);
  
  // Deselect all columns
  const deselectAllColumns = useCallback(() => {
    setColumns(prevColumns => 
      prevColumns.map(column => ({ ...column, isSelected: false }))
    );
  }, []);
  
  // Reset to default columns
  const resetToDefaultColumns = useCallback(() => {
    setColumns(DEFAULT_COLUMNS);
  }, []);
  
  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
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
  }, [data, sortConfig]);
  
  // Get paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);
  
  // Total pages
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  
  // Handle sort request
  const requestSort = useCallback((key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);
  
  // Set data
  const updateData = useCallback((newData: JiraIssue[]) => {
    setData(newData);
    setCurrentPage(1); // Reset to first page when data changes
  }, []);
  
  // Change items per page
  const changeItemsPerPage = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when items per page changes
  }, []);
  
  return {
    // Data
    data: paginatedData,
    allData: sortedData,
    updateData,
    
    // Columns
    columns,
    visibleColumns,
    toggleColumn,
    selectAllColumns,
    deselectAllColumns,
    resetToDefaultColumns,
    
    // Sorting
    sortConfig,
    requestSort,
    
    // Pagination
    currentPage,
    totalPages,
    itemsPerPage,
    setCurrentPage,
    changeItemsPerPage,
  };
};