import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Permission } from "../../config/permissions";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useDrag, useDrop } from "react-dnd";
import PageMeta from "../../components/common/PageMeta";
import { jiraService } from "../../services/jiraService";
import EditIssueModal from "../../components/modals/EditIssueModal";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";

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
      name?: string;
      key?: string;
    };
    assignee?: {
      displayName?: string;
    } | null;
    issuetype?: {
      name?: string;
    };
    status?: {
      name?: string;
    };
    priority?: {
      name?: string;
    };
    created?: string;
    updated?: string;
    reporter?: {
      displayName?: string;
      emailAddress?: string;
    };
    [k: string]: unknown;
  };
}

interface Column {
  key: string;
  title: string;
  isSortable: boolean;
  isSelected: boolean;
}

type ToastType = "success" | "error" | "info";

const AllOpen: React.FC = () => {
  const { userRole, userOrganizationId, userDepartmentId, userDepartmentName, userOrganizationName } = useAuth();
  // --- UI / filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIssueType, setSelectedIssueType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- Data state
  const [issues, setIssues] = useState<Issue[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [issueTypes, setIssueTypes] = useState<{id: string, name: string}[]>([]);
  const [statuses, setStatuses] = useState<{id: string, name: string}[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customFields, setCustomFields] = useState<JiraField[]>([]);
  
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Toast system
  const [toasts, setToasts] = useState<{ id: string; message: string; type?: ToastType }[]>([]);
  const showToast = (message: string, type: ToastType = "info", ttl = 2500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id));
    }, ttl);
  };

  // Confirm dialog state (non-blocking)
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    message?: string;
    onConfirm?: () => Promise<void> | void;
    onCancel?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
  }>({ open: false });

  // column visibility + ordering (defaults tuned for Request Management)
  const [allColumns, setAllColumns] = useState<Column[]>([
    { key: 'key', title: 'Key', isSortable: true, isSelected: true },
    { key: 'issuetype', title: 'Type', isSortable: true, isSelected: true },
    { key: 'summary', title: 'Summary', isSortable: true, isSelected: true },
    { key: 'status', title: 'Status', isSortable: true, isSelected: true },
    { key: 'requesterName', title: 'Requester Name', isSortable: true, isSelected: true },
    { key: 'requesterEmail', title: 'Requester Email', isSortable: true, isSelected: true },
    { key: 'organization', title: 'Organization', isSortable: true, isSelected: true }, // Added organization column
    { key: 'department', title: 'Department', isSortable: true, isSelected: true }, // Added department column
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

  // helper: safe field reader (tries many key variants)
  const getFieldValue = (issue: Issue, keys: string[]): string => {
    if (!issue || !issue.fields) return '';
    for (const k of keys) {
      const val = issue.fields[k];
      if (val === undefined || val === null || val === '') continue;

      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        return String(val);
      }

      // Jira object shapes: { value } or { displayName } or { name } or array
      if (typeof val === 'object') {
        // Type guard for objects with value property
        if (val && typeof val === 'object' && 'value' in val && (val as any).value !== undefined) {
          return String((val as any).value);
        }
        // Type guard for objects with displayName property
        if (val && typeof val === 'object' && 'displayName' in val && (val as any).displayName !== undefined) {
          return String((val as any).displayName);
        }
        // Type guard for objects with name property
        if (val && typeof val === 'object' && 'name' in val && (val as any).name !== undefined) {
          return String((val as any).name);
        }
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') return val[0];
        // nested reporter email example: issue.fields.reporter?.emailAddress
        if (k.includes('.') && k.split('.').length > 1) {
          // support 'reporter.emailAddress'
          const parts = k.split('.');
          let cur: any = issue.fields;
          for (const p of parts) {
            if (!cur) break;
            cur = cur[p];
          }
          if (cur) return String(cur);
        }
        try {
          return JSON.stringify(val);
        } catch {
          return String(val);
        }
      }
    }
    return '';
  };

  // date formatter
  const formatDate = (val?: string) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString();
  };

  // Fetching data on mount and when user context changes
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("=== AllOpen.tsx DEBUG INFO ===");
        console.log("User context:", { userRole, userOrganizationId, userDepartmentId });
        console.log("User department name:", userDepartmentName);
        console.log("User organization name:", userOrganizationName);
        
        // projects
        try {
          const projectsData = await jiraService.getAllProjects();
          setProjects(projectsData || []);
        } catch (err) {
          console.warn("Failed fetch projects", err);
        }

        // issue types - filter to show only Procurement Request
        try {
          const types = await jiraService.getIssueTypes();
          const procurementTypes = types?.filter(type => type.name === "Procurement Request") || [];
          setIssueTypes(procurementTypes);
        } catch (err) {
          console.warn("Failed fetch issue types", err);
        }

        // fields
        try {
          const fields = await jiraService.getFields();
          setCustomFields(Array.isArray(fields) ? fields.filter(f => f.custom) : []);
        } catch (err) {
          console.warn("Failed fetch fields", err);
        }

        // issues
        try {
          console.log("Calling getAllIssues with:", { userRole, userOrganizationId, userDepartmentId });
          const resp = await jiraService.getAllIssues(userRole, userOrganizationId, userDepartmentId, page, pageSize);
          console.log("Received response from getAllIssues:", resp);
          
          const payload = Array.isArray(resp)
            ? { issues: resp, total: resp.length }
            : resp && typeof resp === 'object'
              ? { issues: resp.issues || [], total: resp.total || (resp.issues ? resp.issues.length : 0) }
              : { issues: [], total: 0 };

          const allIssues: Issue[] = Array.isArray(payload.issues) ? payload.issues : [];
          setIssues(allIssues);
          setTotal(payload.total || allIssues.length);

          // derive statuses & assignees
          const uniqueStatuses = Array.from(new Set(filtered.map(i => i.fields?.status?.name).filter(Boolean))).map(s => ({ id: s!, name: s! }));
          
          // Add "Pre Approval" status if not already present and sort
          const allStatuses = uniqueStatuses.some(s => s.name === "Pre Approval") 
            ? uniqueStatuses 
            : [...uniqueStatuses, { id: "Pre Approval", name: "Pre Approval" }];
          
          // Sort statuses alphabetically
          allStatuses.sort((a, b) => a.name.localeCompare(b.name));
          
          setStatuses(allStatuses);

        } catch (err) {
          console.error("Failed fetch issues", err);
          setError("Failed to load requests.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetch();
    
    // Add event listener for new requests
    const handleRequestCreated = () => {
      fetch();
    };
    
    window.addEventListener('requestCreated', handleRequestCreated);
    
    return () => {
      window.removeEventListener('requestCreated', handleRequestCreated);
    };
  }, [userRole, userOrganizationId, userDepartmentId, page, pageSize]);

  // Filtering & sorting
  const filteredIssues = useMemo(() => {
    let res = issues.filter(issue => {
      const summary = (issue.fields?.summary || '').toString().toLowerCase();
      const key = (issue.key || '').toString().toLowerCase();
      return (
        (searchTerm === "" || summary.includes(searchTerm.toLowerCase()) || key.includes(searchTerm.toLowerCase())) &&
        (selectedIssueType === "" || issue.fields?.issuetype?.name === selectedIssueType) &&
        (selectedStatus === "" || issue.fields?.status?.name === selectedStatus)
      );
    });

    if (sortField) {
      res = [...res].sort((a, b) => {
        const getStr = (iss: Issue) => {
          switch (sortField) {
            case 'key': return iss.key || '';
            case 'summary': return iss.fields?.summary || '';
            case 'status': return iss.fields?.status?.name || '';
            case 'organization': return getFieldValue(iss, ['customfield_10337']) || '';
            case 'department': return getFieldValue(iss, ['customfield_10244']) || '';
            case 'created': return iss.fields?.created || '';
            case 'dueDate':
              return getFieldValue(iss, ['dueDate', 'Due Date', 'vendorStartDate', 'customfield_dueDate']);
            default:
              return String(iss.fields?.[sortField] ?? '');
          }
        };
        const aVal = getStr(a);
        const bVal = getStr(b);
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }

    return res;
  }, [issues, searchTerm, selectedIssueType, selectedStatus, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil((total || issues.length || 1) / pageSize));

  // ActionsDropdown (view/edit/delete)
  const ActionsDropdown: React.FC<{ issue: Issue }> = ({ issue }) => {
    const [open, setOpen] = useState(false);
    const ref = React.useRef<HTMLDivElement | null>(null);
    const { hasPermission } = useAuth();
    
    const canEditOrDelete = hasPermission(Permission.EDIT_ISSUE) && hasPermission(Permission.DELETE_ISSUE);

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (!ref.current) return;
        if (!ref.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    const view = () => { navigate(`/request-management/${issue.key}`); setOpen(false); };
    const edit = () => { setSelectedIssue(issue); setIsEditModalOpen(true); setOpen(false); };
    const remove = async () => {
      // show custom confirm dialog
      setConfirmState({
        open: true,
        message: `Delete ${issue.key}?`,
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        onConfirm: async () => {
          try {
            await jiraService.deleteIssue(issue.key);
            // refresh with user context
            const resp = await jiraService.getAllIssues(userRole, userOrganizationId, userDepartmentId);
            const allIssues: Issue[] = Array.isArray(resp) ? resp : (resp && Array.isArray(resp.issues) ? resp.issues : []);
            const filtered = allIssues.filter(i => i.fields?.project?.name === "Request Management");
            setIssues(filtered);
            showToast('Request Deleted', 'success');
          } catch (err) {
            showToast('Delete failed', 'error');
            console.error(err);
          } finally {
            setOpen(false);
          }
        },
        onCancel: () => {
          /* no-op */
        }
      });
    };

    return (
      <div className="relative" ref={ref}>
        <button 
          onClick={() => setOpen(v => !v)} 
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Actions"
        >
          <svg className="w-5 h-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/>
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-1 w-44 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              <button onClick={view} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">View</button>
              {canEditOrDelete && (
                <>
                  <button onClick={edit} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Edit</button>
                  <button onClick={remove} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-700">Delete</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Draggable header (same as your other file)
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
      collect: (m) => ({ isDragging: m.isDragging() }),
    });
    const [, drop] = useDrop({
      accept: 'tableColumn',
      hover(item: { index: number }) {
        const dragIndex = item.index;
        const hoverIndex = index;
        if (dragIndex === hoverIndex) return;
        onMove(dragIndex, hoverIndex);
        item.index = hoverIndex;
      }
    });
    drag(drop(ref));
    return (
      <th ref={ref} className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 ${isDragging ? 'opacity-50' : ''}`}>
        <div onClick={() => column.isSortable && onSort(column.key)} style={{ cursor: column.isSortable ? 'pointer' : 'default' }}>
          {column.title}
          {sortConfig && sortConfig.key === column.key && <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
        </div>
      </th>
    );
  };

  // handle column move: only among visible columns; preserve others
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

  const handleSort = (key: string) => {
    let dir: 'asc' | 'desc' = 'asc';
    if (sortField === key && sortDirection === 'asc') dir = 'desc';
    setSortField(key);
    setSortDirection(dir);
  };

  // get cell renderer
  const getCellValue = (issue: Issue, colKey: string): React.ReactNode => {
    switch (colKey) {
      case 'key':
        return <Link to={`/request-management/${issue.key}`} className="text-blue-600 dark:text-blue-400 hover:underline">{issue.key}</Link>;
      case 'issuetype':
        return issue.fields?.issuetype?.name || '-';
      case 'summary':
        return issue.fields?.summary || '-';
      case 'status':
        return issue.fields?.status?.name || '-';
      case 'requesterName':
        return (
          getFieldValue(issue, ['customfield_10243']) ||
          issue.fields?.reporter?.displayName ||
          '-'
        );
      case 'requesterEmail':
        return (
          getFieldValue(issue, ['customfield_10246']) ||
          issue.fields?.reporter?.emailAddress ||
          '-'
        );
      case 'organization':
        return getFieldValue(issue, ['customfield_10337']) || '-';
      case 'department':
        return getFieldValue(issue, ['customfield_10244']) || '-';
      case 'vendorName':
        return getFieldValue(issue, ['customfield_10290']) || '-';
      case 'productName':
        return getFieldValue(issue, ['customfield_10291']) || '-';
      case 'billingType':
        return getFieldValue(issue, ['customfield_10292']) || '-';
      case 'currentLicenseCount':
        return getFieldValue(issue, ['customfield_10293']) || '-';
      case 'currentUsageCount':
        return getFieldValue(issue, ['customfield_10294']) || '-';
      case 'currentUnits':
        return getFieldValue(issue, ['customfield_10295']) || '-';
      case 'newLicenseCount':
        return getFieldValue(issue, ['customfield_10296']) || '-';
      case 'newUsageCount':
        return getFieldValue(issue, ['customfield_10297']) || '-';
      case 'newUnit':
        return getFieldValue(issue, ['customfield_10298']) || '-';
      case 'licenseUpdateType':
        return getFieldValue(issue, ['customfield_10300']) || '-';
      case 'existingContractId':
        return getFieldValue(issue, ['customfield_10301']) || '-';
      case 'dueDate':
        return formatDate(getFieldValue(issue, ['customfield_10302']));
      case 'renewalDate':
        return formatDate(getFieldValue(issue, ['customfield_10303']));
      case 'additionalComments':
        return getFieldValue(issue, ['customfield_10304']) || '-';
      case 'created':
        return issue.fields?.created ? new Date(issue.fields.created).toLocaleDateString() : '-';
      case 'actions':
        return <ActionsDropdown issue={issue} />;
      default:
        // try custom field fallback
        return String(issue.fields?.[colKey] ?? '-');
    }
  };

  if (loading) {
    return (
      <>
        <PageMeta title="All Requests" description="All open requests (Request Management)" />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">All Requests</h1>
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta title="All Requests" description="All open requests (Request Management)" />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">All Requests</h1>
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error: {error}</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="All Requests" description="All open requests (Request Management)" />
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Requests</h1>
            <div className="flex space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search requests..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="relative">
                <label htmlFor="issueTypeFilter" className="sr-only">Filter by Issue Type</label>
                <select
                  id="issueTypeFilter"
                  className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={selectedIssueType}
                  onChange={(e) => setSelectedIssueType(e.target.value)}
                >
                  <option value="">All Procurement Requests</option>
                  {issueTypes.map(type => (
                    <option key={type.id} value={type.name}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <label htmlFor="statusFilter" className="sr-only">Filter by Status</label>
                <select
                  id="statusFilter"
                  className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status.id} value={status.name}>{status.name}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Table */}
          <DndProvider backend={HTML5Backend}>
            <div className="border border-gray-200 rounded-lg bg-white shadow-sm" style={{ height: '65vh' }}>
              <div className="overflow-y-auto" style={{ height: '100%' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {visibleColumns.map((col, idx) => (
                        <DraggableHeader key={col.key} column={col} index={idx} onSort={handleSort} sortConfig={sortField ? { key: sortField, direction: sortDirection } : null} onMove={handleColumnMove} />
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIssues.length === 0 && (
                      <TableRow>
                        <td colSpan={visibleColumns.length} className="px-6 py-8 text-center text-sm text-gray-500">No requests found</td>
                      </TableRow>
                    )}

                    {filteredIssues.map(issue => (
                      <TableRow key={issue.id}>
                        {visibleColumns.map(col => (
                          <TableCell key={`${issue.id}-${col.key}`} className="px-4 py-3 text-sm align-top" isHeader={false}>
                            {getCellValue(issue, col.key)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DndProvider>

          <div className="mt-3 text-sm text-gray-500">Showing {filteredIssues.length} of {issues.length} requests</div>

          {/* Modals */}
          {selectedIssue && <EditIssueModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedIssue(null); }} onSubmit={async (key, data) => { await jiraService.updateIssue(key, data); /* Refresh simplified */ }} issue ={selectedIssue} />}

        </div>

        {/* Confirm Dialog */}
        {confirmState.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
              <div className="text-lg font-medium text-gray-900 dark:text-white mb-4">{confirmState.message}</div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setConfirmState(s => ({ ...s, open: false }));
                    confirmState.onCancel?.();
                  }}
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  {confirmState.cancelLabel || "Cancel"}
                </button>
                <button
                  onClick={async () => {
                    setConfirmState(s => ({ ...s, open: false }));
                    try {
                      await confirmState.onConfirm?.();
                    } catch (e) {
                      // if onConfirm throws, we swallow here (onConfirm should handle errors)
                      console.error(e);
                    }
                  }}
                  className="px-4 py-2 rounded bg-red-600 text-white"
                >
                  {confirmState.confirmLabel || "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Toast container - moved lower so it doesn't overlap header icons */}
      <div className="fixed right-5 z-[9999] flex flex-col gap-2 top-16 lg:top-20">
        {toasts.map(t => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`px-4 py-2 rounded shadow-md max-w-xs border pointer-events-auto ${
              t.type === 'success' ? 'bg-green-600 text-white' :
              t.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
};

export default AllOpen;
