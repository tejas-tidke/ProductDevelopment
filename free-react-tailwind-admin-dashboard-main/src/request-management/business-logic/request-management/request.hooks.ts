import { useState, useEffect, useMemo } from "react";
import { requestService } from "./request.service";
import { Issue, Column } from "./request.types";

// Hook for managing request data
export const useRequests = (userRole: string | null, userOrganizationId: string | null, userDepartmentId: string | null) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("=== useRequests DEBUG INFO ===");
        console.log("User context:", { userRole, userOrganizationId, userDepartmentId });
        
        const fetchedIssues = await requestService.getAllIssues(userRole, userOrganizationId, userDepartmentId);
        setIssues(fetchedIssues);
      } catch (err) {
        console.error("Failed to fetch requests", err);
        setError("Failed to load requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [userRole, userOrganizationId, userDepartmentId]);

  return { issues, loading, error, setIssues };
};

// Hook for managing request filters
export const useRequestFilters = (issues: Issue[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIssueType, setSelectedIssueType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const summary = (issue.fields?.summary || '').toString().toLowerCase();
      const key = (issue.key || '').toString().toLowerCase();
      return (
        (searchTerm === "" || summary.includes(searchTerm.toLowerCase()) || key.includes(searchTerm.toLowerCase())) &&
        (selectedIssueType === "" || issue.fields?.issuetype?.name === selectedIssueType) &&
        (selectedStatus === "" || issue.fields?.status?.name === selectedStatus)
      );
    });
  }, [issues, searchTerm, selectedIssueType, selectedStatus]);

  return {
    searchTerm,
    setSearchTerm,
    selectedIssueType,
    setSelectedIssueType,
    selectedStatus,
    setSelectedStatus,
    filteredIssues
  };
};

// Hook for managing request columns
export const useRequestColumns = () => {
  const [allColumns, setAllColumns] = useState<Column[]>([
    { key: 'key', title: 'Key', isSortable: true, isSelected: true },
    { key: 'issuetype', title: 'Type', isSortable: true, isSelected: true },
    { key: 'summary', title: 'Summary', isSortable: true, isSelected: true },
    { key: 'status', title: 'Status', isSortable: true, isSelected: true },
    { key: 'requesterName', title: 'Requester Name', isSortable: true, isSelected: true },
    { key: 'requesterEmail', title: 'Requester Email', isSortable: true, isSelected: true },
    { key: 'organization', title: 'Organization', isSortable: true, isSelected: true },
    { key: 'department', title: 'Department', isSortable: true, isSelected: true },
    { key: 'vendorName', title: 'Vendor', isSortable: false, isSelected: true },
    { key: 'productName', title: 'Product', isSortable: false, isSelected: true },
    { key: 'billingType', title: 'Billing Type', isSortable: false, isSelected: true },
    { key: 'currentLicenseCount', title: 'Current License Count', isSortable: false, isSelected: false },
    { key: 'currentUsageCount', title: 'Current Usage Count', isSortable: false, isSelected: false },
    { key: 'currentUnits', title: 'Units', isSortable: false, isSelected: false },
    { key: 'licenseUpdateType', title: 'Update Type', isSortable: false, isSelected: false },
    { key: 'dueDate', title: 'Due Date', isSortable: true, isSelected: true },
    { key: 'renewalDate', title: 'Renewal Date', isSortable: true, isSelected: true },
    { key: 'additionalComments', title: 'Additional Comments', isSortable: false, isSelected: false },
    { key: 'created', title: 'Created', isSortable: true, isSelected: false },
    { key: 'actions', title: 'Actions', isSortable: false, isSelected: true },
  ]);

  const visibleColumns = allColumns.filter(c => c.isSelected);

  const handleColumnMove = (dragIndex: number, hoverIndex: number) => {
    const visible = allColumns.filter(c => c.isSelected);
    const newOrder = [...visible];
    const [removed] = newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, removed);

    // re-map into allColumns preserving non-selected columns
    let vi = 0;
    const merged = allColumns.map(c => {
      if (!c.isSelected) return c;
      const next = newOrder[vi];
      vi++;
      return next;
    });
    setAllColumns(merged);
  };

  return {
    allColumns,
    visibleColumns,
    setAllColumns,
    handleColumnMove
  };
};

// Hook for managing request sorting
export const useRequestSorting = () => {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    let dir: 'asc' | 'desc' = 'asc';
    if (sortField === key && sortDirection === 'asc') dir = 'desc';
    setSortField(key);
    setSortDirection(dir);
  };

  return {
    sortField,
    sortDirection,
    handleSort
  };
};