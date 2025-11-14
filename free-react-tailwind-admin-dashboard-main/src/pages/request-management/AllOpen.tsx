import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useDrag, useDrop } from "react-dnd";
import PageMeta from "../../components/common/PageMeta";
import { jiraService, IssueData, IssueUpdateData } from "../../services/jiraService";
import EditIssueModal from "../../components/modals/EditIssueModal";
import CreateIssueModal from "../../components/modals/CreateIssueModal";
import { CustomFilterDropdown } from "../../components/filters/CustomFilterDropdown";
import ColumnSelector from "../../components/tables/ColumnSelector";

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
    [k: string]: any;
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
  };
}

interface Column {
  key: string;
  title: string;
  isSortable: boolean;
  isSelected: boolean;
}

const AllOpen: React.FC = () => {
  // --- UI / filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [selectedIssueType, setSelectedIssueType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // --- data state
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>([]);
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);
  const [customFields, setCustomFields] = useState<JiraField[]>([]);

  // modals / selection
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // column visibility + ordering (defaults tuned for Request Management)
  const [allColumns, setAllColumns] = useState<Column[]>([
    { key: 'key', title: 'Key', isSortable: true, isSelected: true },
    { key: 'issuetype', title: 'Type', isSortable: true, isSelected: true },
    { key: 'summary', title: 'Summary', isSortable: true, isSelected: true },
    { key: 'status', title: 'Status', isSortable: true, isSelected: true },
    { key: 'assignee', title: 'Assignee', isSortable: true, isSelected: true },
    { key: 'requesterName', title: 'Requester Name', isSortable: true, isSelected: true },
    { key: 'requesterEmail', title: 'Requester Email', isSortable: true, isSelected: true },
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

  const navigate = useNavigate();

  // helper: toggle column
  const toggleColumn = (columnKey: string) => {
    setAllColumns(prev => prev.map(col => col.key === columnKey ? { ...col, isSelected: !col.isSelected } : col));
  };

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
        if (val.value) return String(val.value);
        if (val.displayName) return String(val.displayName);
        if (val.name) return String(val.name);
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

  // Fetching data on mount
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);

        // projects
        try {
          const projectsData = await jiraService.getAllProjects();
          setProjects(projectsData || []);
        } catch (err) {
          console.warn("Failed fetch projects", err);
        }

        // issue types
        try {
          const types = await jiraService.getIssueTypes();
          setIssueTypes(types || []);
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
          const resp = await jiraService.getAllIssues();
          let allIssues: Issue[] = [];
          if (Array.isArray(resp)) allIssues = resp;
          else if (resp && Array.isArray(resp.issues)) allIssues = resp.issues;
          else allIssues = [];

          // filter to Request Management project only
          const projectNameToShow = "Request Management";
          const filtered = allIssues.filter(i => i.fields?.project?.name === projectNameToShow);
          setIssues(filtered);

          // derive statuses & assignees
          const uniqueStatuses = Array.from(new Set(filtered.map(i => i.fields?.status?.name).filter(Boolean))).map(s => ({ id: s!, name: s! }));
          setStatuses(uniqueStatuses);

          const uniqueAssignees = Array.from(new Set(filtered.map(i => i.fields?.assignee?.displayName).filter(Boolean))).map(a => ({ id: a!, name: a! }));
          setAssignees(uniqueAssignees);
        } catch (err) {
          console.error("Failed fetch issues", err);
          setError("Failed to load requests.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  // Filtering & sorting
  const filteredIssues = useMemo(() => {
    let res = issues.filter(issue => {
      const summary = (issue.fields?.summary || '').toString().toLowerCase();
      const key = (issue.key || '').toString().toLowerCase();
      return (
        (searchTerm === "" || summary.includes(searchTerm.toLowerCase()) || key.includes(searchTerm.toLowerCase())) &&
        (selectedAssignee === "" || issue.fields?.assignee?.displayName === selectedAssignee) &&
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
            case 'assignee': return iss.fields?.assignee?.displayName || '';
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
  }, [issues, searchTerm, selectedAssignee, selectedIssueType, selectedStatus, sortField, sortDirection]);

  // billing helpers per issue (returns booleans)
  const billingIsUsage = (issue: Issue) => {
    const billing = getFieldValue(issue, ['billingType','Billing Type','vendorContractType','contractType']).toLowerCase();
    return /usage|meter|consum/i.test(billing);
  };
  const billingIsLicense = (issue: Issue) => {
    const billing = getFieldValue(issue, ['billingType','Billing Type','vendorContractType','contractType']).toLowerCase();
    return /licen|license|seat|user/i.test(billing);
  };

  // ActionsDropdown (view/edit/delete)
  const ActionsDropdown: React.FC<{ issue: Issue }> = ({ issue }) => {
    const [open, setOpen] = useState(false);
    const ref = React.useRef<HTMLDivElement | null>(null);

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
      if (!confirm(`Delete ${issue.key}?`)) return;
      try {
        await jiraService.deleteIssue(issue.key);
        // refresh
        const resp = await jiraService.getAllIssues();
        let allIssues: Issue[] = Array.isArray(resp) ? resp : (resp && Array.isArray(resp.issues) ? resp.issues : []);
        const filtered = allIssues.filter(i => i.fields?.project?.name === "Request Management");
        setIssues(filtered);
        alert('Deleted');
      } catch (err) {
        alert('Delete failed');
        console.error(err);
      } finally {
        setOpen(false);
      }
    };

    return (
      <div className="relative" ref={(el) => (ref.current = el)}>
        <button onClick={() => setOpen(v => !v)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
          <svg className="w-5 h-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/></svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-1 w-44 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              <button onClick={view} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">View</button>
              <button onClick={edit} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Edit</button>
              <button onClick={remove} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-700">Delete</button>
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
      <th ref={ref} className={`px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 ${isDragging ? 'opacity-50' : ''}`}>
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
      case 'assignee':
        return issue.fields?.assignee?.displayName || 'Unassigned';
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
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Requests</h1>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsCreateModalOpen(true)} className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">Create</button>
              <ColumnSelector columns={allColumns} onColumnToggle={toggleColumn} projectKey="REQUEST_MANAGEMENT" />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
            <div className="md:col-span-2">
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search requests..." className="w-full px-3 py-2 rounded border" />
            </div>
            <div>
              <select value={selectedAssignee} onChange={e => setSelectedAssignee(e.target.value)} className="w-full px-3 py-2 rounded border">
                <option value="">All Assignees</option>
                {assignees.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <select value={selectedIssueType} onChange={e => setSelectedIssueType(e.target.value)} className="w-full px-3 py-2 rounded border">
                <option value="">All Types</option>
                {issueTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="w-full px-3 py-2 rounded border">
                <option value="">All Statuses</option>
                {statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <CustomFilterDropdown customFields={customFields.map(f => ({ id: f.id, name: f.name }))} onSortChange={(f,d) => { setSortField(f); setSortDirection(d); }} onAddFilter={() => {}} />
            </div>
          </div>

          {/* Table */}
          <DndProvider backend={HTML5Backend}>
            <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
              <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                    <tr>
                      {visibleColumns.map((col, idx) => (
                        <DraggableHeader key={col.key} column={col} index={idx} onSort={handleSort} sortConfig={sortField ? { key: sortField, direction: sortDirection } : null} onMove={handleColumnMove} />
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredIssues.length === 0 && (
                      <tr>
                        <td colSpan={visibleColumns.length} className="px-6 py-8 text-center text-sm text-gray-500">No requests found</td>
                      </tr>
                    )}

                    {filteredIssues.map(issue => (
                      <tr key={issue.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {visibleColumns.map(col => (
                          <td key={`${issue.id}-${col.key}`} className="px-4 py-3 text-sm text-gray-900 dark:text-white align-top border-r border-gray-200 dark:border-gray-700">
                            {getCellValue(issue, col.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </DndProvider>

          <div className="mt-3 text-sm text-gray-500">Showing {filteredIssues.length} of {issues.length} requests</div>

          {/* Modals */}
          {selectedIssue && <EditIssueModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedIssue(null); }} onSubmit={async (key, data) => { await jiraService.updateIssue(key, data); /* Refresh simplified */ }} issue={selectedIssue as any} />}
          <CreateIssueModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onIssueCreated={(createdIssue) => {
            console.log("Issue created:", createdIssue);
            navigate("/request-management/all-open");
          }}
        />
      </div>
      </div>
    </>
  );
};

export default AllOpen;
