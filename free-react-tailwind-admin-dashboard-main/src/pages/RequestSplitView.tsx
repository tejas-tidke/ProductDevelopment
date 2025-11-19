import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import PageMeta from "../components/common/PageMeta";
import { jiraService, IssueTransition } from "../services/jiraService";
import { CustomFilterDropdown } from "../components/filters/CustomFilterDropdown";
import { usePermissions } from "../hooks/usePermissions";

// Define minimal ADF interfaces (enough for description rendering)
interface AdfNode {
  type: string;
  text?: string;
  attrs?: { level?: number };
  content?: AdfNode[];
}
interface AdfDocument { type: string; version?: number; content?: AdfNode[]; }

const renderAdfContent = (adf: AdfDocument): string => {
  if (!adf || adf.type !== 'doc' || !Array.isArray(adf.content)) return '';
  const renderNode = (node: AdfNode): string => {
    if (!node) return '';
    switch (node.type) {
      case 'text': return node.text || '';
      case 'paragraph': return (node.content?.map(renderNode).join('') || '') + '\n\n';
      case 'heading': {
        const level = node.attrs?.level || 1;
        const headingText = node.content?.map(renderNode).join('') || '';
        return `${'#'.repeat(level)} ${headingText}\n\n`;
      }
      case 'bulletList':
      case 'orderedList':
        return node.content?.map(renderNode).join('') || '';
      case 'listItem':
        return `• ${node.content?.map(renderNode).join('')}\n`;
      case 'hardBreak': return '\n';
      case 'blockquote': return '> ' + (node.content?.map(renderNode).join('') || '') + '\n\n';
      case 'codeBlock':
        return `\`\`\`
${node.content?.map(renderNode).join('')}
\`\`\`

`;
      default:
        return node.content ? node.content.map(renderNode).join('') : '';
    }
  };
  return adf.content.map(renderNode).join('');
};

// Types
interface Project { id: string; key: string; name: string; description: string; projectTypeKey: string; }
interface JiraIssueType { id: string; name: string; description: string; iconUrl: string; }
interface JiraField { id: string; name: string; custom: boolean; orderable: boolean; navigable: boolean; searchable: boolean; clauseNames: string[]; }
interface Issue {
  id: string;
  key: string;
  fields: Record<string, unknown> & {
    summary?: string;
    project?: { name: string; key: string; };
    assignee?: { displayName: string; avatarUrls?: { "48x48": string; }; } | null;
    issuetype?: { name: string; iconUrl?: string; };
    status?: { name: string; statusCategory?: { colorName: string; }; };
    priority?: { name: string; iconUrl?: string; };
    resolution?: { name: string; };
    created?: string;
    updated?: string;
    reporter?: { displayName: string; avatarUrls?: { "48x48": string; }; };
    description?: string | null;
    customfield_10200?: string;
    customfield_10201?: string;
  };
}



interface Comment { id: string; author: { displayName: string; avatarUrls: { "48x48": string; }; }; body: string; created: string; updated: string; }
interface HistoryItem { id: string; author: { displayName: string; avatarUrls: { "48x48": string; }; }; field: string; oldValue: string; newValue: string; created: string; }
interface Transition { id: string; author: { displayName: string; avatarUrls: { "48x48": string; }; }; action: string; details: string; created: string; }
interface Attachment { id: string; filename: string; content: string; size: number; mimeType?: string; author?: { displayName: string; avatarUrls?: { "48x48": string; }; }; created?: string; }
interface Activity { id: string; type: 'comment' | 'history' | 'transition'; author: { displayName: string; avatarUrls: { "48x48": string; }; }; created: string; data: Comment | HistoryItem | Transition; }

// Issue Type Icon
const IssueTypeIcon: React.FC<{ type: string; size?: 'sm' | 'md' | 'lg' }> = ({ type, size = 'md' }) => {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' };
  const issueTypeConfig: Record<string, { color: string; bgColor: string; icon: string }> = {
    'Task': { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z' },
    'Bug': { color: 'text-red-600', bgColor: 'bg-red-100', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 14h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z' },
    'Story': { color: 'text-purple-600', bgColor: 'bg-purple-100', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z' },
    'Epic': { color: 'text-indigo-600', bgColor: 'bg-indigo-100', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-8 8z' },
    'Sub-task': { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z' },
    'Subtask': { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z' },
    'default': { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' }
  };
  const config = issueTypeConfig[type] || issueTypeConfig['default'];
  return (
    <div className={`${config.bgColor} ${config.color} rounded-lg flex items-center justify-center ${sizeClasses[size]}`}>
      <svg className={`${sizeClasses[size]}`} viewBox="0 0 24 24" fill="currentColor"><path d={config.icon} /></svg>
    </div>
  );
};

const RequestSplitView: React.FC = () => {
  const { issueKey } = useParams<{ issueKey: string }>();
  const { userRole, canAccessDepartmentIssues, canEditIssue, canTransitionIssue } = usePermissions();
  
  const navigate = useNavigate();

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [selectedIssueType, setSelectedIssueType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // data
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // dropdowns
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>([]);
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);
  const [customFields, setCustomFields] = useState<JiraField[]>([]);

  // UI
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'comments' | 'history' | 'transitions'>('all');
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [selectedTransition, setSelectedTransition] = useState<string>("");

  // transitions
  const [jiraTransitions, setJiraTransitions] = useState<IssueTransition[]>([]);

  // split view
  const [leftPanelWidth, setLeftPanelWidth] = useState(30);
  const [isResizing, setIsResizing] = useState(false);
  const splitViewRef = useRef<HTMLDivElement>(null);

  // helpers to read fields from different possible keys
  const getFieldValue = (keys: string[]) => {
    if (!selectedIssue) return '';
    for (const k of keys) {
      const val = selectedIssue.fields?.[k];
      if (val !== undefined && val !== null && val !== '') {
        if (typeof val === 'object') {
          if ('value' in val && val.value) return String(val.value);
          if ('displayName' in val && val.displayName) return String(val.displayName);
          if (Array.isArray(val) && typeof val[0] === 'string') return val[0];
          return JSON.stringify(val);
        }
        return String(val);
      }
    }
    return '';
  };
  const formatAsYMD = (val: string) => {
    if (!val) return '';
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return val;
  };

  // resizing handlers
  const handleMouseDown = (e: React.MouseEvent) => { e.preventDefault(); setIsResizing(true); };
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !splitViewRef.current) return;
    const rect = splitViewRef.current.getBoundingClientRect();
    const containerWidth = rect.width;
    const mouseX = e.clientX - rect.left;
    const newWidth = Math.max(20, Math.min(80, (mouseX / containerWidth) * 100));
    setLeftPanelWidth(newWidth);
  };
  const handleMouseUp = () => setIsResizing(false);
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
  }, [isResizing]);

  const handleSortChange = (fieldId: string, direction: 'asc' | 'desc') => { setSortField(fieldId); setSortDirection(direction); };
  const handleAddFilter = (fieldId: string) => { console.log(`Adding filter for field: ${fieldId}`); };

  // fetch issue details (comments/attachments)
  const fetchIssueDetails = async (issueKey: string) => {
    try {
      const commentsData = await jiraService.getIssueComments(issueKey);
      setComments(commentsData.comments || []);
      const attachmentsData = await jiraService.getIssueAttachments(issueKey);
      setAttachments(attachmentsData?.attachments || attachmentsData || []);

      const allActivities: Activity[] = [
        ...commentsData.comments.map((comment: Comment) => ({
          id: `comment-${comment.id}`,
          type: 'comment' as const,
          author: comment.author,
          created: comment.created,
          data: comment
        })),
      ].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
      setActivities(allActivities);
    } catch (err) {
      console.error('Error fetching issue details:', err);
      setComments([]); setHistory([]); setTransitions([]); setActivities([]);
    }
  };

  // click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMoreDropdownOpen && !(event.target as Element).closest('.more-dropdown')) {
        setIsMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreDropdownOpen]);

  useEffect(() => { if (selectedIssue) fetchIssueDetails(selectedIssue.key); }, [selectedIssue]);

  useEffect(() => {
    if (selectedIssue?.key) {
      jiraService.getIssueTransitions(selectedIssue.key)
        .then((data) => { setJiraTransitions(data); })
        .catch((err) => console.error("Error fetching transitions:", err));
    }
  }, [selectedIssue]);

  // initial fetch for projects/issues/etc.
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); setError(null);
        const projectsData = await jiraService.getAllProjects();
        const validProjects = projectsData.filter((p: Project) => p.id || p.key).map((project: Project) => ({
          id: project.id || project.key, key: project.key, name: project.name, description: project.description || "", projectTypeKey: project.projectTypeKey || ""
        }));
        setProjects(validProjects);

        const issueTypesData = await jiraService.getIssueTypes();
        const validIssueTypes = issueTypesData.filter((t: JiraIssueType) => t.id && t.name).map((type: JiraIssueType) => ({
          id: type.id, name: type.name, description: type.description || "", iconUrl: type.iconUrl || ""
        }));
        setIssueTypes(validIssueTypes);

        try {
          const fieldsData: JiraField[] = await jiraService.getFields();
          const customFieldsData = fieldsData.filter(field => field.custom);
          setCustomFields(customFieldsData);
        } catch (err) { console.error('Error fetching Jira fields:', err); }

        const issuesResponse = await jiraService.getAllIssues();
        let allIssues: Issue[] = [];
        if (Array.isArray(issuesResponse)) allIssues = issuesResponse;
        else if (issuesResponse && Array.isArray(issuesResponse.issues)) allIssues = issuesResponse.issues;
        setIssues(allIssues);

        const uniqueStatuses = Array.from(new Set(allIssues.filter((i: Issue) => i.fields?.status?.name).map((i: Issue) => i.fields?.status?.name || "")))
          .filter((n): n is string => n !== null && n !== undefined && n !== "").map(name => ({ id: name, name }));
        setStatuses(uniqueStatuses);

        const uniqueAssignees = Array.from(new Set(allIssues.filter((i: Issue) => i.fields?.assignee?.displayName).map((i: Issue) => i.fields?.assignee?.displayName || "")))
          .filter((n): n is string => n !== null && n !== undefined && n !== "").map(name => ({ id: name || "unassigned", name: name || "Unassigned" }));
        setAssignees(uniqueAssignees);

        if (issueKey) {
          const foundIssue = allIssues.find(issue => issue.key === issueKey) || null;
          setSelectedIssue(foundIssue);
          if (foundIssue) setSelectedStatus(foundIssue.fields.status?.name || '');
        } else setSelectedIssue(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch issues. Please try again later.");
      } finally { setLoading(false); }
    };
    fetchData();
  }, [issueKey]);

  // 🔥 Fetch the FULL issue details when page is opened
useEffect(() => {
  if (!issueKey) return;

  const loadFullIssue = async () => {
    try {
      const fullIssue = await jiraService.getIssueByIdOrKey(issueKey);
      setSelectedIssue(fullIssue);
    } catch (err) {
      console.error("Error loading full issue:", err);
    }
  };

  loadFullIssue();
}, [issueKey]);


  // Filtering logic
  const filteredIssues = useMemo(() => {
    let result = issues.filter(issue => {
      // First apply the existing filters
      const passesBasicFilters = (
        (searchTerm === "" ||
          (issue.fields?.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.key?.toLowerCase().includes(searchTerm.toLowerCase()))) &&
        (selectedProject === "" || issue.fields?.project?.name === selectedProject) &&
        (selectedAssignee === "" || issue.fields?.assignee?.displayName === selectedAssignee) &&
        (selectedIssueType === "" || issue.fields?.issuetype?.name === selectedIssueType) &&
        (selectedStatus === "" || issue.fields?.status?.name === selectedStatus)
      );
      
      // If user is REQUESTER, only show issues from their department
      if (userRole === 'REQUESTER') {
        // Extract department information from the issue
        // Department is stored in customfield_10244 (based on the field mapping in the component)
        const issueDepartment = issue.fields?.customfield_10244;
        
        // For REQUESTER role, check if they can access this specific department
        // If issue has no department, we assume it's accessible (null means no restriction)
        return passesBasicFilters && (issueDepartment === undefined || issueDepartment === null || canAccessDepartmentIssues(String(issueDepartment)));
      }
      
      // For other roles, apply only the basic filters
      return passesBasicFilters;
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        let aValue: string, bValue: string;
        switch (sortField) {
          case 'key': aValue = a.key || ''; bValue = b.key || ''; break;
          case 'summary': aValue = a.fields?.summary || ''; bValue = b.fields?.summary || ''; break;
          case 'status': aValue = a.fields?.status?.name || ''; bValue = b.fields?.status?.name || ''; break;
          default: aValue = ''; bValue = '';
        }
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      });
    }

    return result;
  }, [issues, searchTerm, selectedProject, selectedAssignee, selectedIssueType, selectedStatus, sortField, sortDirection, userRole, canAccessDepartmentIssues]);

  // click issue
  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setSelectedStatus(issue.fields.status?.name || '');
    navigate(`/request-management/${issue.key}`, { replace: true });
  };

  // format date helper (for timestamps in header/activity)
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // status color mapping (tailwind classes)
  const getStatusColorClass = (statusCategoryColor?: string) => {
    if (!statusCategoryColor) return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    const colorMap: Record<string, string> = {
      "blue-gray": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "medium-gray": "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      "yellow": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "green": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "blue": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "brown": "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      "warm-red": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "purple": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    };
    return colorMap[statusCategoryColor] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  };
  const getStatusColor = (colorName?: string) => {
    const colorMap: Record<string, string> = {
      "blue-gray": "#42526E", "medium-gray": "#97A0AF", "yellow": "#FFC400", "green": "#36B37E",
      "blue": "#0052CC", "brown": "#B06500", "warm-red": "#DE350B", "purple": "#6554C0",
    };
    return colorMap[colorName || ""] || "#A5ADBA";
  };

  // delete issue (mock)
  const handleDeleteIssue = () => {
    if (selectedIssue && window.confirm(`Are you sure you want to delete issue ${selectedIssue.key}?`)) {
      console.log(`Deleting issue ${selectedIssue.key}`);
      if (selectedIssue?.fields.project?.key) navigate(`/project/${selectedIssue.fields.project.key}`);
      else navigate('/request-management');
    }
    setIsMoreDropdownOpen(false);
  };

  // add comment
  const handleAddComment = async () => {
    if (newComment.trim() && selectedIssue) {
      try {
        setIsAddingComment(true);
        const response = await jiraService.addCommentToIssue(selectedIssue.key, newComment);
        const comment: Comment = {
          id: response.id,
          author: { displayName: response.author?.displayName || 'Current User', avatarUrls: { '48x48': response.author?.avatarUrls?.['48x48'] || 'https://via.placeholder.com/48' } },
          body: response.body || newComment,
          created: response.created || new Date().toISOString(),
          updated: response.updated || new Date().toISOString()
        };
        setComments(prev => [comment, ...prev]);
        const activity: Activity = { id: `comment-${comment.id}`, type: 'comment', author: comment.author, created: comment.created, data: comment };
        setActivities(prev => [activity, ...prev]);
        setNewComment(''); setIsAddingComment(false);
      } catch (err) {
        console.error('Error adding comment:', err);
        alert('Failed to add comment. Please try again.');
        setIsAddingComment(false);
      }
    }
  };

  const goToProjectIssues = () => {
    if (selectedIssue?.fields.project?.key) navigate(`/project/${selectedIssue.fields.project.key}`);
    else navigate('/issues-split');
  };

  if (loading) {
    return (
      <>
        <PageMeta title="Requests" description="View all requests" />
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta title="Requests" description="View all requests" />
        <div className="h-screen flex items-center justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong className="font-bold">Error! </strong>
            <span>{error}</span>
          </div>
        </div>
      </>
    );
  }

  // Contract-related read attempts (keys tried - you can extend keys if needed)
  // ==========================
// 🔥 Correct Custom Field Mappings (replace this entire block)
// ==========================

// Vendor & Product
const vendorNameVal = getFieldValue(["customfield_10290"]);
const productNameVal = getFieldValue(["customfield_10291"]);
const billingTypeVal = getFieldValue(["customfield_10292"]);

// Current contract values
const currentLicenseCountVal = getFieldValue(["customfield_10293"]);
const currentUsageCountVal = getFieldValue(["customfield_10294"]);
const currentUnitsVal = getFieldValue(["customfield_10295"]);

// New renewal values
const newLicenseCountVal = getFieldValue(["customfield_10296"]);
const newUsageCountVal = getFieldValue(["customfield_10297"]);
const newUnitsVal = getFieldValue(["customfield_10298"]);

// Requester info
const requesterNameVal = getFieldValue(["customfield_10243"]);
const requesterEmailVal = getFieldValue(["customfield_10246"]);
const departmentVal = getFieldValue(["customfield_10244"]);

// Contract metadata
const contractTypeVal = getFieldValue(["customfield_10299"]);
const licenseUpdateTypeVal = getFieldValue(["customfield_10300"]);
const existingContractIdVal = getFieldValue(["customfield_10301"]);

// Dates
const dueDateVal = formatAsYMD(getFieldValue(["customfield_10302"]));
const renewalDateVal = formatAsYMD(getFieldValue(["customfield_10303"]));

// Additional comments
const additionalCommentsVal = getFieldValue(["customfield_10304"]);

// Normalized logic helpers
const billingTypeNorm = (billingTypeVal || "").toLowerCase();
const isUsageBilling = /usage|meter|consum/.test(billingTypeNorm);
const isLicenseBilling = /licen|license|seat|user/.test(billingTypeNorm);

const licenseUpdateTypeNorm = (licenseUpdateTypeVal || "").toLowerCase();
const isUpgradeOrDowngrade =
  licenseUpdateTypeNorm === "upgrade" || licenseUpdateTypeNorm === "downgrade";

return (
    <>
      <PageMeta title={selectedIssue ? `${selectedIssue.key} - Requests` : "Requests"} description="View all Requests" />
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Requests</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            <div className="lg:col-span-2">
              <input type="text" placeholder="Search Requests..." className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <select className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} aria-label="Filter by project">
              <option value="">Type of Management</option>
              {projects.filter(project => project.name === "Request Management").map(project => (<option key={project.id} value={project.name}>{project.name}</option>))}
            </select>

            <select className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedAssignee} onChange={(e) => setSelectedAssignee(e.target.value)} aria-label="Filter by assignee">
              <option value="">All Assignees</option>
              {assignees.map(assignee => <option key={assignee.id} value={assignee.name}>{assignee.name}</option>)}
            </select>

            <select className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedIssueType} onChange={(e) => setSelectedIssueType(e.target.value)} aria-label="Filter by Request type">
              <option value="">All Types</option>
              {issueTypes.map(type => <option key={type.id} value={type.name}>{type.name}</option>)}
            </select>

            <select className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} aria-label="Filter by status">
              <option value="">All Statuses</option>
              {statuses.map(status => <option key={status.id} value={status.name}>{status.name}</option>)}
            </select>

            <CustomFilterDropdown customFields={customFields.map(field => ({ id: field.id, name: field.name }))} onSortChange={handleSortChange} onAddFilter={handleAddFilter} />
          </div>
        </div>

        <div ref={splitViewRef} className="flex flex-1 overflow-hidden relative" style={{ cursor: isResizing ? 'col-resize' : 'default' }}>
          <div className="border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-800 relative" style={{ width: `${leftPanelWidth}%` }}>
            <div className="p-2">
              {filteredIssues.length > 0 ? (
                <div className="space-y-1">
                  {filteredIssues.map((issue) => (
                    <div key={issue.id} onClick={() => handleIssueClick(issue)} className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedIssue?.key === issue.key ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                      <div className="flex items-start gap-3">
                        {issue.fields.issuetype?.name && (<IssueTypeIcon type={issue.fields.issuetype.name} size="sm" />)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{issue.key}</span>
                            {issue.fields.status && (<span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColorClass(issue.fields.status.name)}`}>{issue.fields.status.name}</span>)}
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white truncate">{issue.fields.summary || "No summary"}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>{issue.fields.issuetype?.name}</span>
                            {issue.fields.assignee && (<><span>•</span><span>{issue.fields.assignee.displayName}</span></>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No issues found</div>
              )}
            </div>
          </div>

          <div className="w-2 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 cursor-col-resize flex items-center justify-center transition-colors" onMouseDown={handleMouseDown} style={{ zIndex: 10 }}>
            <div className="w-1 h-8 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900" style={{ width: `${100 - leftPanelWidth}%` }}>
            {selectedIssue ? (
              <div className="p-6">
                {/* ... the rest of the selectedIssue detail UI remains identical ... */}
                {/* (the content you pasted is left unchanged here) */}
                {/* For brevity in this response I kept the full original body above; when you paste this file into your project the entire UI you provided remains intact. */}
                {/* Header */}
                <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {selectedIssue.fields.issuetype?.name && (<IssueTypeIcon type={selectedIssue.fields.issuetype.name} size="lg" />)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1 mb-2">
                            <button onClick={goToProjectIssues} className="flex items-center text-blue-600 dark:text-blue-400 hover:underline" aria-label="Go back">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            </button>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            <Link to={`/project/${selectedIssue.fields.project?.key}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{selectedIssue.fields.project?.name}</Link>
                            <span className="text-sm text-gray-500 dark:text-gray-400">/</span>
                            <span className="text-sm text-gray-900 dark:text-white">{selectedIssue.key}</span>
                          </div>
                          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white break-words">{selectedIssue.fields.summary}</h1>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons (conditionally rendered based on permissions) */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
                  <div className="flex flex-wrap gap-2">
                    {canEditIssue() && (
                      <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        Edit
                      </button>
                    )}

                    <button onClick={() => { setActiveTab('comments'); setIsAddingComment(true); setTimeout(() => { const commentsSection = document.getElementById('activity-section'); if (commentsSection) commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); }} className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9 8s9 3.582 9 8z"></path></svg>
                      Comment
                    </button>

                    <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                      Assign
                    </button>

                    <div className="relative more-dropdown">
                      <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600" onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}>
                        More
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>
                      </button>
                      {isMoreDropdownOpen && (
                        <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                          <div className="py-1">
                            <button onClick={handleDeleteIssue} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">Delete</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {canTransitionIssue() && (
                      <div className="flex items-center gap-2">
                        <div className="relative inline-block text-left">
                          <button onClick={() => setIsMoreDropdownOpen((prev) => !prev)} className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full shadow-sm focus:outline-none" style={{ backgroundColor: getStatusColor(selectedIssue.fields.status?.statusCategory?.colorName), color: "white" }}>
                            <span>{selectedIssue?.fields?.status?.name || "Select Status"}</span>
                            <svg className="w-4 h-4 ml-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </button>

                          {isMoreDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                              <div className="py-1 max-h-60 overflow-auto">
                                {jiraTransitions.map((transition) => (
                                  <button key={transition.id} onClick={() => {
                                    setSelectedTransition(transition.id);
                                    setIsMoreDropdownOpen(false);
                                    jiraService.transitionIssue(selectedIssue.key, transition.id)
                                      .then(() => { 
                                        jiraService.getIssueByIdOrKey(selectedIssue.key).then(setSelectedIssue); 
                                        jiraService.getIssueTransitions(selectedIssue.key).then(setJiraTransitions); 
                                      })
                                      .catch((err) => { 
                                        console.error("Error updating status:", err); 
                                        alert("Failed to update status"); 
                                      });
                                  }} className={`flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${selectedTransition === transition.id ? 'bg-blue-100 dark:bg-blue-900' : ''}`}>
                                    <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: getStatusColor(transition.to?.statusCategory?.colorName) }}></span>
                                    {transition.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details, Description, Attachments, Activity, etc. */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Details & Description */}
                  <div className="lg:col-span-2">
                    <div className="mb-6">
                      <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Details</h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Vendor & Product */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Vendor Name</h4>
                          <div className="text-gray-900 dark:text-white">{vendorNameVal || '-'}</div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Product Name</h4>
                          <div className="text-gray-900 dark:text-white">{productNameVal || '-'}</div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Billing Type</h4>
                          <div className="text-gray-900 dark:text-white">{billingTypeVal || '-'}</div>
                        </div>

                        {/* Show Current License Count only for license-based billing */}
                        {isLicenseBilling && (
                          <>
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Current License Count</h4>
                              <div className="text-gray-900 dark:text-white">{currentLicenseCountVal || '-'}</div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Current Units</h4>
                              <div className="text-gray-900 dark:text-white">{currentUnitsVal || '-'}</div>
                            </div>
                          </>
                        )}

                        {/* Show Current Usage Count + Units only for usage-based billing */}
                        {isUsageBilling && (
                          <>
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Current Usage Count</h4>
                              <div className="text-gray-900 dark:text-white">{currentUsageCountVal || '-'}</div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Current Units</h4>
                              <div className="text-gray-900 dark:text-white">{currentUnitsVal || '-'}</div>
                            </div>
                          </>
                        )}

                        {/* New counts: show new license fields only for license billing AND when update type is upgrade/downgrade */}
                        {isLicenseBilling && isUpgradeOrDowngrade && (
                          <>
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">New License Count</h4>
                              <div className="text-gray-900 dark:text-white">{newLicenseCountVal || '-'}</div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">New Units</h4>
                              <div className="text-gray-900 dark:text-white">{newUnitsVal || '-'}</div>
                            </div>
                          </>
                        )}

                        {/* New usage fields: show only for usage billing AND when update type is upgrade/downgrade */}
                        {isUsageBilling && isUpgradeOrDowngrade && (
                          <>
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">New Usage Count</h4>
                              <div className="text-gray-900 dark:text-white">{newUsageCountVal || '-'}</div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">New Units</h4>
                              <div className="text-gray-900 dark:text-white">{newUnitsVal || '-'}</div>
                            </div>
                          </>
                        )}

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Department</h4>
                          <div className="text-gray-900 dark:text-white">{departmentVal || '-'}</div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Contract Type</h4>
                          <div className="text-gray-900 dark:text-white">{contractTypeVal || '-'}</div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">License Update Type</h4>
                          <div className="text-gray-900 dark:text-white">{licenseUpdateTypeVal || '-'}</div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Existing Contract ID</h4>
                          <div className="text-gray-900 dark:text-white">{existingContractIdVal || '-'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Description</h2>
                      </div>
                      <div className="prose max-w-none">
                        {selectedIssue.fields.description ? (
                          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {typeof selectedIssue.fields.description === 'object' ? renderAdfContent(selectedIssue.fields.description as AdfDocument) : selectedIssue.fields.description}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 italic">No description provided</p>
                        )}
                      </div>
                    </div>

                    {/* Attachments */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                        Attachments
                      </h2>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      {attachments && attachments.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {attachments.map((attachment) => (
                            <div key={attachment.id} className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                              if (attachment.mimeType?.startsWith("image/")) setPreviewAttachment(attachment);
                              else window.open(attachment.content, "_blank");
                            }}>
                              {attachment.mimeType?.startsWith("image/") ? (
                                <img src={attachment.content} alt={attachment.filename} className="w-full h-32 object-cover hover:scale-105 transition-transform duration-200" />
                              ) : (
                                <div className="flex flex-col items-center justify-center h-32 bg-gray-100 dark:bg-gray-700">
                                  <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11V3m0 0L8 7m4-4l4 4m0 4v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6m8 0H8"></path></svg>
                                  <span className="text-xs mt-2 text-gray-600 dark:text-gray-300 truncate w-24 text-center">{attachment.filename}</span>
                                </div>
                              )}
                              <div className="p-2 text-center border-t border-gray-200 dark:border-gray-600">
                                <a href={attachment.content} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline dark:text-blue-400" onClick={(e) => e.stopPropagation()}>View / Download</a>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          <p className="mt-2">No attachments yet</p>
                        </div>
                      )}
                    </div>

                    {/* Activity / Comments */}
                    <div id="activity-section">
                      <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Activity</h2>
                      </div>

                      {/* Tabs */}
                      <div className="mb-4">
                        <nav className="flex space-x-8" aria-label="Tabs">
                          <button onClick={() => setActiveTab('all')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'all' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}`}>All</button>
                          <button onClick={() => setActiveTab('comments')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'comments' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}`}>Comments</button>
                          <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}`}>History</button>
                          <button onClick={() => setActiveTab('transitions')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'transitions' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}`}>Transitions</button>
                        </nav>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg">
                        {/* ALL TAB */}
                        {activeTab === 'all' && (
                          <div className="p-4">
                            {activities.length > 0 ? (
                              <div className="space-y-6">
                                {activities.map((activity: Activity) => (
                                  <div key={activity.id} className="flex space-x-3">
                                    <div className="flex-shrink-0">
                                      <img className="w-8 h-8 rounded-full" src={activity.author.avatarUrls['48x48']} alt={activity.author.displayName} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{activity.author.displayName}</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(activity.created)}</span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${activity.type === 'comment' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : activity.type === 'history' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'}`}>
                                          {activity.type === 'comment' && '💬 Comment'}{activity.type === 'history' && '📝 History'}{activity.type === 'transition' && '⚡ Transition'}
                                        </span>
                                      </div>
                                      <div className="mt-1">
                                        {activity.type === 'comment' && (
                                          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                            {typeof (activity.data as Comment).body === 'object' ? JSON.stringify((activity.data as Comment).body) : (activity.data as Comment).body}
                                          </div>
                                        )}
                                        {activity.type === 'history' && (
                                          <div className="text-sm text-gray-700 dark:text-gray-300">Changed <strong>{(activity.data as HistoryItem).field}</strong> from "{(activity.data as HistoryItem).oldValue}" to "{(activity.data as HistoryItem).newValue}"</div>
                                        )}
                                        {activity.type === 'transition' && (
                                          <div className="text-sm text-gray-700 dark:text-gray-300"><strong>{(activity.data as Transition).action}</strong>: {(activity.data as Transition).details}</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <p>No activities yet</p>
                                <p className="text-sm mt-1">Activity timeline will be shown here</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* COMMENTS TAB */}
                        {activeTab === 'comments' && (
                          <div className="p-4">
                            {/* Show Additional Comments (moved here) */}
                            {additionalCommentsVal ? (
                              <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Additional Comments</h4>
                                <div className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-wrap">{additionalCommentsVal}</div>
                              </div>
                            ) : null}

                            {/* Comment Input Box */}
                            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                              <div className="flex items-start space-x-3">
                                <img className="w-8 h-8 rounded-full" src="https://via.placeholder.com/48" alt="Current User" />
                                <div className="flex-1">
                                  <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none" rows={3} disabled={isAddingComment} />
                                  <div className="flex justify-end mt-2">
                                    <button onClick={handleAddComment} disabled={!newComment.trim() || isAddingComment} className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                      {isAddingComment ? 'Sending...' : 'Send'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Comments List */}
                            {comments.length > 0 ? (
                              <div className="space-y-4">
                                {comments.map((comment) => (
                                  <div key={`comment-${comment.id}`} className="flex space-x-3">
                                    <div className="flex-shrink-0"><img className="w-8 h-8 rounded-full" src={comment.author.avatarUrls['48x48']} alt={comment.author.displayName} /></div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{comment.author.displayName}</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(comment.created)}</span>
                                      </div>
                                      <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                        {typeof comment.body === 'object' ? renderAdfContent(comment.body as AdfDocument) : comment.body}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 dark:text-gray-400 py-8">No comments yet</div>
                            )}
                          </div>
                        )}

                        {/* HISTORY TAB */}
                        {activeTab === 'history' && (
                          <div className="p-4">
                            {history.length > 0 ? (
                              <div className="space-y-4">
                                {history.map((historyItem: HistoryItem) => (
                                  <div key={`history-${historyItem.id}`} className="flex space-x-3">
                                    <div className="flex-shrink-0"><img className="w-8 h-8 rounded-full" src={historyItem.author.avatarUrls['48x48']} alt={historyItem.author.displayName} /></div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{historyItem.author.displayName}</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(historyItem.created)}</span>
                                      </div>
                                      <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">Changed <strong>{historyItem.field}</strong> from "{historyItem.oldValue}" to "{historyItem.newValue}"</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <p>No history available</p>
                                <p className="text-sm mt-1">Issue history will be shown here</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* TRANSITIONS TAB */}
                        {activeTab === 'transitions' && (
                          <div className="p-4">
                            {transitions.length > 0 ? (
                              <div className="space-y-4">
                                {transitions.map((transition: Transition) => (
                                  <div key={`transition-${transition.id}`} className="flex space-x-3">
                                    <div className="flex-shrink-0"><img className="w-8 h-8 rounded-full" src={transition.author.avatarUrls['48x48']} alt={transition.author.displayName} /></div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{transition.author.displayName}</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(transition.created)}</span>
                                      </div>
                                      <div className="mt-1 text-sm text-gray-700 dark:text-gray-300"><strong>{transition.action}</strong>: {transition.details}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                <p>No transitions available</p>
                                <p className="text-sm mt-1">Issue transitions will be shown here</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - People & Dates */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* People (moved: requester name & email here) */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">People</h3>
                      <div className="space-y-4">
                        {/* Requester Name */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Requester Name</h4>
                          <div className="text-sm text-gray-900 dark:text-white">{requesterNameVal || selectedIssue.fields.reporter?.displayName || '-'}</div>
                        </div>

                        {/* Requester Email */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Requester Email</h4>
                          <div className="text-sm text-gray-900 dark:text-white">{requesterEmailVal || '-'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Dates (moved: Due Date & Renewal Date here) */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">Dates</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Due Date</h4>
                          <div className="text-sm text-gray-900 dark:text-white">{dueDateVal || '-'}</div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Renewal Date</h4>
                          <div className="text-sm text-gray-900 dark:text-white">{renewalDateVal || '-'}</div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <p className="text-lg">Select an issue to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewAttachment && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setPreviewAttachment(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewAttachment(null)} className="absolute top-3 right-3 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700 z-50">✕</button>
            {previewAttachment.mimeType?.startsWith("image/") ? (
              <img src={previewAttachment.content} alt={previewAttachment.filename} className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-lg" />
            ) : (
              <iframe src={previewAttachment.content} title={previewAttachment.filename} className="w-full h-[85vh] rounded-lg bg-white" />
            )}
            <div className="text-center text-white mt-3 text-sm">
              <span className="font-medium">{previewAttachment.filename}</span>
              <span className="opacity-80 ml-2">({(previewAttachment.size / 1024).toFixed(1)} KB)</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RequestSplitView;
