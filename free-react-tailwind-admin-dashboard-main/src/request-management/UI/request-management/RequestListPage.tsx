import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../../context/AuthContext";
import { Permission } from "../../../config/permissions";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import PageMeta from "../../../components/common/PageMeta";
import { jiraService } from "../../../services/jiraService";
import { RequestTable } from "./RequestTable";
import { RequestFilters } from "./RequestFilters";
import {
  useRequests,
  useRequestFilters,
  useRequestColumns,
  useRequestSorting,
  Issue,
  JiraIssueType
} from "../../business-logic/request-management";

interface Project {
  id: string;
  key: string;
  name: string;
  description: string;
  projectTypeKey: string;
}

const RequestListPage: React.FC = () => {
  const { userRole, userOrganizationId, userDepartmentId, userDepartmentName, userOrganizationName } = useAuth();
  const navigate = useNavigate();

  // --- Data state
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[]>([]);
  const [statuses, setStatuses] = useState<{id: string, name: string}[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);

  // Convert numeric IDs to strings for the hooks
  const userOrgIdString = userOrganizationId ? userOrganizationId.toString() : null;
  const userDeptIdString = userDepartmentId ? userDepartmentId.toString() : null;

  // --- Request data hooks
  const { issues, loading, error, setIssues } = useRequests(userRole, userOrgIdString, userDeptIdString);
  const { 
    searchTerm, 
    setSearchTerm, 
    selectedIssueType, 
    setSelectedIssueType, 
    selectedStatus, 
    setSelectedStatus, 
    filteredIssues 
  } = useRequestFilters(issues);
  
  const { 
    allColumns, 
    visibleColumns, 
    setAllColumns, 
    handleColumnMove 
  } = useRequestColumns();
  
  const { 
    sortField, 
    sortDirection, 
    handleSort 
  } = useRequestSorting();

  // Fetching data on mount and when user context changes
  useEffect(() => {
    const fetch = async () => {
      try {
        console.log("=== RequestListPage DEBUG INFO ===");
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

        // derive statuses
        const uniqueStatuses = Array.from(new Set(issues.map(i => i.fields?.status?.name).filter(Boolean))).map(s => ({ id: s!, name: s! }));
        setStatuses(uniqueStatuses);

      } catch (err) {
        console.error("Failed to fetch data", err);
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
  }, [userRole, userOrganizationId, userDepartmentId, issues]);

  // Sorting
  const sortedIssues = React.useMemo(() => {
    if (!sortField) return filteredIssues;
    
    return [...filteredIssues].sort((a, b) => {
      const getStr = (iss: Issue) => {
        switch (sortField) {
          case 'key': return iss.key || '';
          case 'summary': return iss.fields?.summary || '';
          case 'status': return iss.fields?.status?.name || '';
          case 'organization': return iss.fields?.customfield_10337 || '';
          case 'department': return iss.fields?.customfield_10244 || '';
          case 'created': return iss.fields?.created || '';
          case 'dueDate':
            return iss.fields?.customfield_dueDate || '';
          default:
            return String(iss.fields?.[sortField] ?? '');
        }
      };
      const aVal = String(getStr(a));
      const bVal = String(getStr(b));
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [filteredIssues, sortField, sortDirection]);

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
          <RequestFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedIssueType={selectedIssueType}
            setSelectedIssueType={setSelectedIssueType}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            issueTypes={issueTypes}
            statuses={statuses}
          />

          {/* Table */}
          <DndProvider backend={HTML5Backend}>
            <RequestTable
              issues={sortedIssues}
              visibleColumns={visibleColumns}
              allColumns={allColumns}
              handleColumnMove={handleColumnMove}
              handleSort={handleSort}
              sortField={sortField}
              sortDirection={sortDirection}
              setIssues={setIssues}
              userRole={userRole}
              userOrganizationId={userOrgIdString}
              userDepartmentId={userDeptIdString}
            />
          </DndProvider>

          <div className="mt-3 text-sm text-gray-500">Showing {sortedIssues.length} of {issues.length} requests</div>
        </div>
      </div>
    </>
  );
};

export default RequestListPage;