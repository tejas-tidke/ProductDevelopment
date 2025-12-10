import React, { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../../context/AuthContext";
import { Permission } from "../../../config/permissions";
import { jiraService } from "../../../services/jiraService";
import EditIssueModal from "../../../components/modals/EditIssueModal";
import { DraggableHeader } from "./RequestTableHeader";
import { Issue, Column, getFieldValue, formatDate } from "../../business-logic/request-management";

interface RequestTableProps {
  issues: Issue[];
  visibleColumns: Column[];
  allColumns: Column[];
  handleColumnMove: (dragIndex: number, hoverIndex: number) => void;
  handleSort: (key: string) => void;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  userRole: string | null;
  userOrganizationId: string | null;
  userDepartmentId: string | null;
}

export const RequestTable: React.FC<RequestTableProps> = ({
  issues,
  visibleColumns,
  allColumns,
  handleColumnMove,
  handleSort,
  sortField,
  sortDirection,
  setIssues,
  userRole,
  userOrganizationId,
  userDepartmentId
}) => {
  const { hasPermission } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // ActionsDropdown (view/edit/delete)
  const ActionsDropdown: React.FC<{ issue: Issue }> = ({ issue }) => {
    const [open, setOpen] = useState(false);
    const ref = React.useRef<HTMLDivElement | null>(null);
    const { hasPermission } = useAuth();
    
    const canEditOrDelete = hasPermission(Permission.EDIT_ISSUE) && hasPermission(Permission.DELETE_ISSUE);

    React.useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (!ref.current) return;
        if (!ref.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    const view = () => { 
      window.location.hash = `/request-management/${issue.key}`;
      setOpen(false); 
    };
    const edit = () => { 
      setSelectedIssue(issue); 
      setIsEditModalOpen(true); 
      setOpen(false); 
    };
    const remove = async () => {
      if (!confirm(`Delete ${issue.key}?`)) return;
      try {
        await jiraService.deleteIssue(issue.key);
        // refresh with user context
        // Convert string IDs to numbers as expected by the backend
        const orgId = userOrganizationId ? parseInt(userOrganizationId, 10) : null;
        const deptId = userDepartmentId ? parseInt(userDepartmentId, 10) : null;
        
        const resp = await jiraService.getAllIssues(userRole, orgId, deptId);
        const allIssues: Issue[] = Array.isArray(resp) ? resp : (resp && Array.isArray(resp.issues) ? resp.issues : []);
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

  return (
    <>
      <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                {visibleColumns.map((col, idx) => (
                  <DraggableHeader 
                    key={col.key} 
                    column={col} 
                    index={idx} 
                    onSort={handleSort} 
                    sortConfig={sortField ? { key: sortField, direction: sortDirection } : null} 
                    onMove={handleColumnMove} 
                  />
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {issues.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-6 py-8 text-center text-sm text-gray-500">No requests found</td>
                </tr>
              )}

              {issues.map(issue => (
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

      {/* Modals */}
      {selectedIssue && (
        <EditIssueModal 
          isOpen={isEditModalOpen} 
          onClose={() => { 
            setIsEditModalOpen(false); 
            setSelectedIssue(null); 
          }} 
          onSubmit={async (key, data) => { 
            await jiraService.updateIssue(key, data); 
            // Refresh simplified
          }} 
          issue={selectedIssue as any} 
        />
      )}
    </>
  );
};