import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import PageMeta from "../components/common/PageMeta";
import { jiraService, IssueTransition } from "../services/jiraService";
import { CustomFilterDropdown } from "../components/filters/CustomFilterDropdown";
import { usePermissions } from "../hooks/usePermissions";
import EditIssueModal from "../components/modals/EditIssueModal";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { commentService } from "../services/commentService";

// Define minimal ADF interfaces (enough for description rendering)
interface AdfNode {
  type: string;
  text?: string;
  attrs?: { level?: number };
  content?: AdfNode[];
}
interface AdfDocument {
  type: string;
  version?: number;
  content?: AdfNode[];
}

const renderAdfContent = (adf: AdfDocument): string => {
  if (!adf || adf.type !== "doc" || !Array.isArray(adf.content)) return "";
  const renderNode = (node: AdfNode): string => {
    if (!node) return "";
    switch (node.type) {
      case "text":
        return node.text || "";
      case "paragraph":
        return (node.content?.map(renderNode).join("") || "") + "\n\n";
      case "heading": {
        const level = node.attrs?.level || 1;
        const headingText = node.content?.map(renderNode).join("") || "";
        return `${"#".repeat(level)} ${headingText}\n\n`;
      }
      case "bulletList":
      case "orderedList":
        return node.content?.map(renderNode).join("") || "";
      case "listItem":
        return `• ${node.content?.map(renderNode).join("")}\n`;
      case "hardBreak":
        return "\n";
      case "blockquote":
        return (
          "> " + (node.content?.map(renderNode).join("") || "") + "\n\n"
        );
      case "codeBlock":
        return `\`\`\`
${node.content?.map(renderNode).join("")}
\`\`\`

`;
      default:
        return node.content ? node.content.map(renderNode).join("") : "";
    }
  };
  return adf.content.map(renderNode).join("");
};

// Types
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
  fields: Record<string, unknown> & {
    summary?: string;
    project?: { name: string; key: string };
    assignee?:
      | { displayName: string; avatarUrls?: { "48x48": string } }
      | null;
    issuetype?: { name: string; iconUrl?: string };
    status?: { name: string; statusCategory?: { colorName: string } };
    priority?: { name: string; iconUrl?: string };
    resolution?: { name: string };
    created?: string;
    updated?: string;
    reporter?: {
      displayName: string;
      avatarUrls?: { "48x48": string };
    };
    description?: string | null;
    customfield_10200?: string;
    customfield_10201?: string;
  };
}

// Type for EditIssueModal
interface EditModalIssue {
  id: string;
  key: string;
  fields: {
    summary?: string;
    project?: {
      key: string;
    };
    description?: string;
    duedate?: string;
    issuetype?: {
      name: string;
    };
    customfield_10200?: string;
  };
}

interface Comment {
  id: string;
  author: { displayName: string; avatarUrls: { "48x48": string } };
  body: string;
  created: string;
  updated: string;
  parentCommentId?: number | null;
  replies?: Comment[];
}

interface HistoryItem {
  id: string;
  author: { displayName: string; avatarUrls: { "48x48": string } };
  field: string;
  oldValue: string;
  newValue: string;
  created: string;
}
interface Transition {
  id: string;
  author: { displayName: string; avatarUrls: { "48x48": string } };
  action: string;
  details: string;
  created: string;
}
interface Attachment {
  id: string;
  filename: string;
  content: string;
  size: number;
  mimeType?: string;
  author?: {
    displayName: string;
    avatarUrls?: { "48x48": string };
  };
  created?: string;
  // Fields from our database
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  uploadedBy?: string;
  stage?: string;
  uploadedAt?: string;
  jiraIssueKey?: string;
  proposalId?: number;
}

interface ContractProposalDto {
  id: number;
  jiraIssueKey: string;
  proposalNumber: number;
  proposalType: string;
  licenseCount: number;
  unitCost: number;
  totalCost: number;
  comment: string;
  createdAt: string;
  final: boolean;
}

interface Activity {
  id: string;
  type: "comment" | "history" | "transition";
  author: { displayName: string; avatarUrls: { "48x48": string } };
  created: string;
  data: Comment | HistoryItem | Transition;
}

// Issue Type Icon
const IssueTypeIcon: React.FC<{ type: string; size?: "sm" | "md" | "lg" }> = ({
  type,
  size = "md",
}) => {
  const sizeClasses = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-8 h-8" };
  const issueTypeConfig: Record<
    string,
    { color: string; bgColor: string; icon: string }
  > = {
    Task: {
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
    },
    Bug: {
      color: "text-red-600",
      bgColor: "bg-red-100",
      icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 14h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z",
    },
    Story: {
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
    },
    Epic: {
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-8 8z",
    },
    "Sub-task": {
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      icon: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
    },
    Subtask: {
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      icon: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
    },
    default: {
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    },
  };
  const config = issueTypeConfig[type] || issueTypeConfig["default"];
  return (
    <div
      className={`${config.bgColor} ${config.color} rounded-lg flex items-center justify-center ${sizeClasses[size]}`}
    >
      <svg
        className={`${sizeClasses[size]}`}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d={config.icon} />
      </svg>
    </div>
  );
};

const RequestSplitView: React.FC = () => {
  const { issueKey } = useParams<{ issueKey: string }>();
  const { userRole, canAccessDepartmentIssues } = usePermissions();

  // Get current user information from AuthContext
  const { userData } = useAuth();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // helper to read fields
  const getFieldValue = (keys: string[]) => {
    if (!selectedIssue) return "";
    for (const k of keys) {
      const val = selectedIssue.fields?.[k];
      if (val !== undefined && val !== null && val !== "") {
        if (typeof val === "object") {
          if ("value" in val && (val as any).value) return String((val as any).value);
          if ("displayName" in val && (val as any).displayName)
            return String((val as any).displayName);
          if (Array.isArray(val) && typeof val[0] === "string") return val[0];
          return JSON.stringify(val);
        }
        return String(val);
      }
    }
    return "";
  };

  // Custom function to check if issue can be edited
  const canEditIssue = () => {
    const currentStatus = selectedIssue?.fields?.status?.name || "";
    if (currentStatus === "Completed" || currentStatus === "Declined") {
      return false;
    }
    return true;
  };

  const navigate = useNavigate();
  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [selectedIssueType, setSelectedIssueType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  // dropdowns
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>(
    []
  );
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);
  const [customFields, setCustomFields] = useState<JiraField[]>([]);

  // UI
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments">("comments");

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(
    null
  );
  const [replyText, setReplyText] = useState("");

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [proposals, setProposals] = useState<ContractProposalDto[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const { issueKey: issueKeyFromParams } = useParams();

  const [selectedTransition, setSelectedTransition] = useState<string>("");

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // quote upload state
  const [isUploadQuoteModalOpen, setIsUploadQuoteModalOpen] = useState(false);
  const [isTransitionDropdownOpen, setIsTransitionDropdownOpen] =
    useState(false);

  const [currentProposal, setCurrentProposal] = useState<
    "first" | "second" | "third" | "final"
  >("first");

  const [unitCost, setUnitCost] = useState("");
  const [editableLicenseCount, setEditableLicenseCount] = useState(
    getFieldValue(["customfield_10293", "customfield_10294"]) || "0"
  );
  const totalCost = Number(editableLicenseCount || 0) * Number(unitCost || 0);

  const [proposalComment, setProposalComment] = useState("");

  const [quoteAttachments, setQuoteAttachments] = useState<File[]>([]);

  const [hasSubmittedFinalQuote, setHasSubmittedFinalQuote] = useState(false);

  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  const [previewProposal, setPreviewProposal] =
    useState<ContractProposalDto | null>(null);

  const [leftPanelWidth, setLeftPanelWidth] = useState(30);
  const [isResizing, setIsResizing] = useState(false);
  const splitViewRef = useRef<HTMLDivElement>(null);

  const isInNegotiationStage =
    selectedIssue?.fields?.status?.name === "Negotiation Stage";

  const isTransitionDisabled =
    userRole !== "SUPER_ADMIN" &&
    isInNegotiationStage &&
    !hasSubmittedFinalQuote;

  const formatAsYMD = (val: string) => {
    if (!val) return "";
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return val;
  };

  // resizing handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };
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
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleSortChange = (fieldId: string, direction: "asc" | "desc") => {
    setSortField(fieldId);
    setSortDirection(direction);
  };
  const handleAddFilter = (fieldId: string) => {
    console.log(`Adding filter for field: ${fieldId}`);
  };

  // fetch issue details (comments/attachments)
  const fetchIssueDetails = async (issueKey: string) => {
    try {
      // Fetch comments using our custom comment service
      const commentsResponse = await commentService.getCommentsByIssueKey(
        issueKey
      );
      const customComments = commentsResponse.comments || [];

      // Recursive mapper: backend CommentDto -> UI Comment
      const mapDtoToUiComment = (dto: any): Comment => ({
        id: dto.id.toString(),
        author: {
          displayName: dto.userName,
          avatarUrls: { "48x48": "https://via.placeholder.com/48" },
        },
        body: dto.commentText,
        created: dto.createdAt,
        updated: dto.updatedAt || dto.createdAt,
        parentCommentId: dto.parentCommentId ?? null,
        replies: (dto.replies || []).map(mapDtoToUiComment),
      });

      const formattedComments: Comment[] = customComments.map(mapDtoToUiComment);
      setComments(formattedComments);

      // flatten comments for activities
      const flattenComments = (items: Comment[]): Comment[] =>
        items.reduce<Comment[]>((acc, c) => {
          acc.push(c);
          if (c.replies && c.replies.length) {
            acc.push(...flattenComments(c.replies));
          }
          return acc;
        }, []);

      const flatComments = flattenComments(formattedComments);

      // Fetch attachments from our database instead of Jira directly
      const attachmentsData = await jiraService.getAttachmentsByIssueKey(
        issueKey
      );

      const transformedAttachments: Attachment[] = (attachmentsData || []).map(
        (attachment: any) => ({
          id: attachment.id?.toString() || "",
          filename: attachment.fileName || attachment.filename || "Unknown file",
          content: attachment.fileUrl || attachment.content || "",
          size: attachment.fileSize || attachment.size || 0,
          mimeType: attachment.mimeType || "",
          created:
            attachment.uploadedAt ||
            attachment.created ||
            new Date().toISOString(),
          fileName: attachment.fileName,
          fileUrl: attachment.fileUrl,
          fileSize: attachment.fileSize,
          uploadedBy: attachment.uploadedBy,
          stage: attachment.stage,
          uploadedAt: attachment.uploadedAt,
          jiraIssueKey: attachment.jiraIssueKey,
          proposalId: attachment.proposalId,
        })
      );

      setAttachments(transformedAttachments);

      const allActivities: Activity[] = [
        ...flatComments.map((comment: Comment) => ({
          id: `comment-${comment.id}`,
          type: "comment" as const,
          author: comment.author,
          created: comment.created,
          data: comment,
        })),
      ].sort(
        (a, b) =>
          new Date(b.created).getTime() - new Date(a.created).getTime()
      );
      setActivities(allActivities);
    } catch (err) {
      console.error("Error fetching issue details:", err);
      setComments([]);
      setHistory([]);
      setTransitions([]);
      setActivities([]);
    }
  };

  // Fetch proposal details for preview modal
  const handlePreviewProposal = async (proposalId: number) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/jira/proposals/${proposalId}`
      );

      if (!res.ok) throw new Error("Failed to load proposal");

      const data = await res.json();
      setPreviewProposal(data);
    } catch (err) {
      console.error("Preview load error:", err);
      alert("Failed to load proposal preview");
    }
  };

  const loadProposals = async (issueKey: string) => {
    try {
      setIsLoadingProposals(true);
      const res = await fetch(
        `http://localhost:8080/api/jira/proposals/issue/${issueKey}`
      );

      if (!res.ok) {
        throw new Error("Failed to load proposals");
      }
      const data: ContractProposalDto[] = await res.json();
      setProposals(data || []);

      // If any proposal is final → allow transition from negotiation
      const hasFinal = (data || []).some((p) => p.final);
      setHasSubmittedFinalQuote(hasFinal);
    } catch (err) {
      console.error("Error loading proposals:", err);
      setProposals([]);
      setHasSubmittedFinalQuote(false);
    } finally {
      setIsLoadingProposals(false);
    }
  };

  // click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMoreDropdownOpen &&
        !(event.target as Element).closest(".more-dropdown")
      ) {
        setIsMoreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [isMoreDropdownOpen]);

  useEffect(() => {
    if (selectedIssue) fetchIssueDetails(selectedIssue.key);
  }, [selectedIssue]);

  useEffect(() => {
    if (selectedIssue?.key) {
      // placeholder for transitions if needed
    }
  }, [selectedIssue]);

  // initial fetch for projects/issues/etc.
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const projectsData = await jiraService.getAllProjects();
        const validProjects = projectsData
          .filter((p: Project) => p.id || p.key)
          .map((project: Project) => ({
            id: project.id || project.key,
            key: project.key,
            name: project.name,
            description: project.description || "",
            projectTypeKey: project.projectTypeKey || "",
          }));

        const issueTypesData = await jiraService.getIssueTypes();
        const validIssueTypes = issueTypesData
          .filter((t: JiraIssueType) => t.id && t.name)
          .map((type: JiraIssueType) => ({
            id: type.id,
            name: type.name,
            description: type.description || "",
            iconUrl: type.iconUrl || "",
          }));
        setIssueTypes(validIssueTypes);

        try {
          const fieldsData: JiraField[] = await jiraService.getFields();
          const customFieldsData = fieldsData.filter((field) => field.custom);
          setCustomFields(customFieldsData);
        } catch (err) {
          console.error("Error fetching Jira fields:", err);
        }

        // Get only issues from the "Request Management" project
        const requestManagementProject = validProjects.find(
          (p: Project) => p.name === "Request Management"
        );
        let allIssues: Issue[] = [];

        if (requestManagementProject) {
          try {
            const projectIssues = await jiraService.getIssuesForProject(
              requestManagementProject.key
            );
            if (Array.isArray(projectIssues)) allIssues = projectIssues;
            else if (
              projectIssues &&
              Array.isArray((projectIssues as any).issues)
            )
              allIssues = (projectIssues as any).issues;
          } catch (projectErr) {
            console.error(
              "Error fetching issues for Request Management project:",
              projectErr
            );
            const issuesResponse = await jiraService.getAllIssues();
            if (Array.isArray(issuesResponse)) allIssues = issuesResponse;
            else if (
              issuesResponse &&
              Array.isArray((issuesResponse as any).issues)
            )
              allIssues = (issuesResponse as any).issues;
          }
        } else {
          const issuesResponse = await jiraService.getAllIssues();
          if (Array.isArray(issuesResponse)) allIssues = issuesResponse;
          else if (
            issuesResponse &&
            Array.isArray((issuesResponse as any).issues)
          )
            allIssues = (issuesResponse as any).issues;
        }

        setIssues(allIssues);

        const uniqueStatuses = Array.from(
          new Set(
            allIssues
              .filter((i: Issue) => i.fields?.status?.name)
              .map((i: Issue) => i.fields?.status?.name || "")
          )
        )
          .filter(
            (n): n is string =>
              n !== null && n !== undefined && n !== ""
          )
          .map((name) => ({ id: name, name }));
        setStatuses(uniqueStatuses);

        const uniqueAssignees = Array.from(
          new Set(
            allIssues
              .filter((i: Issue) => i.fields?.assignee?.displayName)
              .map(
                (i: Issue) => i.fields?.assignee?.displayName || ""
              )
          )
        )
          .filter(
            (n): n is string =>
              n !== null && n !== undefined && n !== ""
          )
          .map((name) => ({
            id: name || "unassigned",
            name: name || "Unassigned",
          }));
        setAssignees(uniqueAssignees);

        if (issueKey) {
          const foundIssue =
            allIssues.find((issue) => issue.key === issueKey) || null;
          setSelectedIssue(foundIssue);
          if (foundIssue)
            setSelectedStatus(foundIssue.fields.status?.name || "");
        } else setSelectedIssue(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch issues. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [issueKey]);

  // Fetch full issue details when page is opened
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

  // Set default filters
  useEffect(() => {
    if (!selectedProject) {
      setSelectedProject("Request Management");
    }
    if (selectedStatus === undefined) {
      setSelectedStatus("");
    }
  }, [selectedProject, selectedStatus]);

  // Filtering logic
  const filteredIssues = useMemo(() => {
    let result = issues.filter((issue) => {
      if (issue.fields?.project?.name !== "Request Management") {
        return false;
      }

      const passesBasicFilters =
        (searchTerm === "" ||
          issue.fields?.summary
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          issue.key?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedAssignee === "" ||
          issue.fields?.assignee?.displayName === selectedAssignee) &&
        (selectedIssueType === "" ||
          issue.fields?.issuetype?.name === selectedIssueType) &&
        (selectedStatus === "" ||
          issue.fields?.status?.name === selectedStatus);

      if (userRole === "REQUESTER") {
        const issueDepartment =
          (issue.fields as any)?.customfield_10244;
        return (
          passesBasicFilters &&
          (issueDepartment === undefined ||
            issueDepartment === null ||
            canAccessDepartmentIssues(String(issueDepartment)))
        );
      }

      return passesBasicFilters;
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        let aValue: string, bValue: string;
        switch (sortField) {
          case "key":
            aValue = a.key || "";
            bValue = b.key || "";
            break;
          case "summary":
            aValue = a.fields?.summary || "";
            bValue = b.fields?.summary || "";
            break;
          case "status":
            aValue = a.fields?.status?.name || "";
            bValue = b.fields?.status?.name || "";
            break;
          default:
            aValue = "";
            bValue = "";
        }
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
    }

    return result;
  }, [
    issues,
    searchTerm,
    selectedAssignee,
    selectedIssueType,
    selectedStatus,
    sortField,
    sortDirection,
    userRole,
    canAccessDepartmentIssues,
  ]);

  // click issue
  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setSelectedStatus(issue.fields.status?.name || "");
    setHasSubmittedFinalQuote(false);
    navigate(`/request-management/${issue.key}`, { replace: true });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColorClass = (statusCategoryColor?: string) => {
    if (!statusCategoryColor)
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    const colorMap: Record<string, string> = {
      "blue-gray":
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "medium-gray":
        "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      yellow:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      green:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      brown:
        "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      "warm-red":
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      purple:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    };
    return (
      colorMap[statusCategoryColor] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    );
  };
  const getStatusColor = (colorName?: string) => {
    const colorMap: Record<string, string> = {
      "blue-gray": "#42526E",
      "medium-gray": "#97A0AF",
      yellow: "#FFC400",
      green: "#36B37E",
      blue: "#0052CC",
      brown: "#B06500",
      "warm-red": "#DE350B",
      purple: "#6554C0",
    };
    return colorMap[colorName || ""] || "#A5ADBA";
  };

  // Insert a reply into the nested comments tree
  const insertReplyIntoTree = (
    nodes: Comment[],
    parentId: string,
    reply: Comment
  ): Comment[] => {
    return nodes.map((node) => {
      if (node.id === parentId) {
        const existingReplies = node.replies || [];
        return {
          ...node,
          replies: [...existingReplies, reply],
        };
      }

      if (node.replies && node.replies.length > 0) {
        return {
          ...node,
          replies: insertReplyIntoTree(node.replies, parentId, reply),
        };
      }

      return node;
    });
  };

  const handleDeleteIssue = () => {
    if (
      selectedIssue &&
      window.confirm(
        `Are you sure you want to delete issue ${selectedIssue.key}?`
      )
    ) {
      console.log(`Deleting issue ${selectedIssue.key}`);
      if (selectedIssue?.fields.project?.key)
        navigate(`/project/${selectedIssue.fields.project.key}`);
      else navigate("/request-management");
    }
    setIsMoreDropdownOpen(false);
  };

  const handleAddComment = async () => {
    if (newComment.trim() && selectedIssue) {
      try {
        setIsAddingComment(true);

        if (!userData) {
          throw new Error("User not authenticated");
        }

        const response = await commentService.addComment({
          issueKey: selectedIssue.key,
          userId: userData.user.id,
          userName: userData.user.name,
          commentText: newComment,
          parentCommentId: null,
        });

        const comment: Comment = {
          id: response.id.toString(),
          author: {
            displayName: response.userName || userData.user.name,
            avatarUrls: {
              "48x48": "https://via.placeholder.com/48",
            },
          },
          body: response.commentText || newComment,
          created: response.createdAt || new Date().toISOString(),
          updated:
            response.updatedAt ||
            response.createdAt ||
            new Date().toISOString(),
          parentCommentId: response.parentCommentId ?? null,
          replies: [],
        };

        setComments((prev) => [comment, ...prev]);
        const activity: Activity = {
          id: `comment-${comment.id}`,
          type: "comment",
          author: comment.author,
          created: comment.created,
          data: comment,
        };
        setActivities((prev) => [activity, ...prev]);
        setNewComment("");
      } catch (err) {
        console.error("Error adding comment:", err);
        alert("Failed to add comment. Please try again.");
      } finally {
        setIsAddingComment(false);
      }
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!replyText.trim() || !selectedIssue) return;

    try {
      setIsAddingComment(true);

      if (!userData) {
        throw new Error("User not authenticated");
      }

      const response = await commentService.addComment({
        issueKey: selectedIssue.key,
        userId: userData.user.id,
        userName: userData.user.name,
        commentText: replyText,
        parentCommentId: Number(parentId),
      });

      const replyComment: Comment = {
        id: response.id.toString(),
        author: {
          displayName: response.userName || userData.user.name,
          avatarUrls: {
            "48x48": "https://via.placeholder.com/48",
          },
        },
        body: response.commentText || replyText,
        created: response.createdAt || new Date().toISOString(),
        updated:
          response.updatedAt ||
          response.createdAt ||
          new Date().toISOString(),
        parentCommentId: response.parentCommentId ?? Number(parentId),
        replies: [],
      };

      setComments((prev) => insertReplyIntoTree(prev, parentId, replyComment));

      const activity: Activity = {
        id: `comment-${replyComment.id}`,
        type: "comment",
        author: replyComment.author,
        created: replyComment.created,
        data: replyComment,
      };
      setActivities((prev) => [activity, ...prev]);

      setReplyingToCommentId(null);
      setReplyText("");
    } catch (err) {
      console.error("Error adding reply:", err);
      alert("Failed to add reply. Please try again.");
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleEditIssue = () => {
    if (selectedIssue && canEditIssue()) {
      setIsEditModalOpen(true);
    }
  };

  const convertIssueForEditModal = (issue: Issue): EditModalIssue => {
    return {
      ...issue,
      fields: {
        ...issue.fields,
        description: issue.fields.description || undefined,
        project: issue.fields.project
          ? { key: issue.fields.project.key }
          : undefined,
        duedate: undefined,
        issuetype: issue.fields.issuetype
          ? { name: issue.fields.issuetype.name }
          : undefined,
      },
    } as EditModalIssue;
  };

  const goToProjectIssues = () => {
    if (selectedIssue?.fields.project?.key)
      navigate(`/project/${selectedIssue.fields.project.key}`);
    else navigate("/issues-split");
  };

  const buildToStatus = (id: string, name: string, color: string = "green") => ({
    id,
    name,
    statusCategory: {
      id: 3,
      key: "done",
      colorName: color,
    },
  });

  const getCustomTransitions = (): IssueTransition[] => {
    if (!selectedIssue) return [];

    const role = userRole;
    const currentStatus = selectedIssue.fields?.status?.name || "";

    const transitions: IssueTransition[] = [];

    const APPROVE_DECLINE = (approveId: string, toName: string) => [
      {
        id: approveId,
        name: "Approve",
        to: buildToStatus(approveId, toName),
      },
      {
        id: "6",
        name: "Decline",
        to: buildToStatus("6", "Declined", "warm-red"),
      },
    ];

    switch (currentStatus) {
      case "Request Created":
        transitions.push(...APPROVE_DECLINE("3", "Pre-Approval"));
        break;
      case "Pre-Approval":
      case "Pre-approval":
        transitions.push(...APPROVE_DECLINE("2", "Request Review Stage"));
        break;
      case "Request Review Stage":
        transitions.push(...APPROVE_DECLINE("4", "Negotiation Stage"));
        break;
      case "Negotiation Stage":
        transitions.push(...APPROVE_DECLINE("5", "Post Approval"));
        break;
      case "Post Approval":
        transitions.push(...APPROVE_DECLINE("7", "Completed"));
        break;
      case "Completed":
      case "Declined":
        return [];
    }

    switch (role) {
      case "SUPER_ADMIN":
      case "ADMIN":
        return transitions;
      case "DEPARTMENT_APPROVER":
        return transitions.filter((t) => t.id !== "4");
      case "EMPLOYEE":
        if (currentStatus === "Request Created") return transitions;
        return [];
      case "REQUESTER":
      default:
        return [];
    }
  };

  const customTransitions = getCustomTransitions();

  const calculateTotalCost = () => {
    const licenseCount = parseInt(
      getFieldValue(["customfield_10293", "customfield_10294"]) || "0",
      10
    );
    const unitCostValue = parseFloat(unitCost || "0");
    return (licenseCount * unitCostValue).toFixed(2);
  };

  // Contract-related field reads
  const vendorNameVal = getFieldValue(["customfield_10290"]);
  const productNameVal = getFieldValue(["customfield_10291"]);
  const billingTypeVal = getFieldValue(["customfield_10292"]);
  const vendorContractTypeVal = getFieldValue(["customfield_10245"]);

  const currentLicenseCountVal = getFieldValue(["customfield_10293"]);
  const currentUsageCountVal = getFieldValue(["customfield_10294"]);
  const currentUnitsVal = getFieldValue(["customfield_10295"]);

  const newLicenseCountVal = getFieldValue(["customfield_10296"]);
  const newUsageCountVal = getFieldValue(["customfield_10297"]);
  const newUnitsVal = getFieldValue(["customfield_10298"]);

  const requesterNameVal = getFieldValue(["customfield_10243"]);
  const requesterEmailVal = getFieldValue(["customfield_10246"]);
  const departmentVal = getFieldValue(["customfield_10244"]);
  const organizationVal = getFieldValue(["customfield_10337"]);

  const contractTypeVal = getFieldValue(["customfield_10299"]);
  const licenseUpdateTypeVal = getFieldValue(["customfield_10300"]);
  const existingContractIdVal = getFieldValue(["customfield_10301"]);

  const dueDateVal = formatAsYMD(getFieldValue(["customfield_10302"]));
  const renewalDateVal = formatAsYMD(getFieldValue(["customfield_10303"]));
  const contractDurationVal = getFieldValue(["customfield_10438"]);
  console.log('Contract duration value:', contractDurationVal);
  console.log('Selected issue:', selectedIssue);

  const additionalCommentsVal = getFieldValue(["customfield_10304"]);

  // Calculate renewal date based on completion date + contract duration
  const calculateRenewalDate = (): string => {
    console.log('Calculating renewal date...');
    console.log('Selected issue for renewal calculation:', selectedIssue);
    
    // If request is completed, calculate renewal date as completion date + contract duration
    const isCompleted = selectedIssue?.fields?.status?.name === "Completed";
    console.log('Is issue completed:', isCompleted);
    
    if (isCompleted && contractDurationVal) {
      console.log('Issue is completed and has contract duration');
      // For completed requests, renewal date = completion date + contract duration
      // As a simplification, we'll use the issue's updated date as the completion date
      // In a more complete implementation, we would get the exact date when status changed to "Completed"
      const completionDateStr = selectedIssue?.fields?.updated;
      console.log('Completion date string:', completionDateStr);
      console.log('Contract duration:', contractDurationVal);
      console.log('Is completed:', isCompleted);
      
      if (completionDateStr) {
        const completionDate = new Date(completionDateStr);
        // Check if the date is valid
        if (isNaN(completionDate.getTime())) {
          console.log('Invalid completion date');
          return renewalDateVal || "-";
        }
        
        const duration = parseInt(contractDurationVal, 10);
        console.log('Parsed duration:', duration);
        
        if (!isNaN(duration) && duration > 0) {
          const renewalDate = new Date(completionDate);
          renewalDate.setMonth(renewalDate.getMonth() + duration);
          const result = renewalDate.toISOString().split('T')[0];
          console.log('Calculated renewal date:', result);
          return result;
        } else {
          console.log('Invalid duration or duration not positive');
        }
      } else {
        console.log('No completion date found');
      }
    } else {
      console.log('Not completed or no contract duration:', isCompleted, contractDurationVal);
    }
    
    // For non-completed requests, show the stored renewal date
    console.log('Returning stored renewal date:', renewalDateVal || "-");
    return renewalDateVal || "-";
  };

  const billingTypeNorm = (billingTypeVal || "").toLowerCase();
  const isUsageBilling = /usage|meter|consum/.test(billingTypeNorm);
  const isLicenseBilling = /licen|license|seat|user/.test(billingTypeNorm);

  const licenseUpdateTypeNorm = (licenseUpdateTypeVal || "").toLowerCase();
  const isUpgradeOrDowngrade =
    licenseUpdateTypeNorm === "upgrade" ||
    licenseUpdateTypeNorm === "downgrade";

  const mapProposalType: Record<string, string> = {
    first: "FIRST",
    second: "SECOND",
    third: "THIRD",
    final: "FINAL",
  };

  const handleSubmitQuote = async () => {
    if (!selectedIssue) {
      alert("No issue selected");
      return;
    }

    setIsSubmittingQuote(true);

    try {
      const issueKey = selectedIssue.key;
      const isFinal = currentProposal === "final";

      const proposalRes = await fetch(
        "http://localhost:8080/api/jira/contracts/add-proposal",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jiraIssueKey: issueKey,
            licenseCount: editableLicenseCount,
            unitCost: unitCost,
            totalCost: totalCost,
            comment: proposalComment,
            isFinal: isFinal,
            proposalType: mapProposalType[currentProposal],
          }),
        }
      );

      if (!proposalRes.ok) {
        throw new Error("Failed to save proposal");
      }

      const proposalData = await proposalRes.json();
      const proposalId: number =
        proposalData.proposalId ?? proposalData.id ?? null;

      let uploadedAttachments: Attachment[] = [];

      for (const file of quoteAttachments) {
        const resp = await jiraService.addAttachmentToIssue(issueKey, file);

        if (Array.isArray(resp)) {
          uploadedAttachments.push(...resp);
        } else if (resp && Array.isArray((resp as any).attachments)) {
          uploadedAttachments.push(...(resp as any).attachments);
        }
      }

      const stageMap: Record<typeof currentProposal, string> = {
        first: "FIRST_PROPOSAL",
        second: "SECOND_PROPOSAL",
        third: "THIRD_PROPOSAL",
        final: "FINAL_PROPOSAL",
      };

      await Promise.all(
        uploadedAttachments.map((att) =>
          fetch("http://localhost:8080/api/jira/contracts/save-attachment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              issueKey,
              fileName: att.filename,
              fileUrl: att.content,
              fileSize: att.size,
              uploadedBy:
                att.author?.displayName || requesterNameVal || "Unknown",
              stage: stageMap[currentProposal],
              proposalId: proposalId,
            }),
          })
        )
      );

      if (issueKeyFromParams) {
        await loadProposals(issueKeyFromParams);
      }
      await fetchIssueDetails(issueKey);

      if (isFinal) {
        setHasSubmittedFinalQuote(true);

        await fetch(
          "http://localhost:8080/api/jira/contracts/update-license-count",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              issueKey,
              newLicenseCount: editableLicenseCount,
            }),
          }
        );
      }

      setProposalComment("");
      setQuoteAttachments([]);
      setCurrentProposal("first");
      setIsUploadQuoteModalOpen(false);

      addNotification({
        title: "Proposal saved",
        message: `Proposal for ${issueKey} saved successfully.`,
        issueKey: issueKey,
      });
    } catch (error) {
      console.error("Error submitting quote:", error);
      alert("Failed to submit proposal. Please try again.");
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleCustomTransition = async (transitionId: string) => {
    try {
      if (!selectedIssue?.key) {
        throw new Error("No issue selected");
      }

      const issueKey = selectedIssue.key;

      await jiraService.transitionIssueCustom(issueKey, transitionId);

      const updatedIssue = await jiraService.getIssueByIdOrKey(issueKey);
      setSelectedIssue(updatedIssue);

      const newStatus = updatedIssue?.fields?.status?.name;
      if (newStatus === "Completed") {
        await fetch(
          "http://localhost:8080/api/jira/contracts/mark-completed",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              issueKey: issueKey,
              transitionKey: transitionId,
              nameOfVendor: vendorNameVal || null,
              productName: productNameVal || null,
              requesterName: requesterNameVal || null,
              requesterMail: requesterEmailVal || null,
              requesterDepartment: departmentVal || null,
              requesterOrganization: organizationVal || null,
              vendorContractType: vendorContractTypeVal || null,
              additionalComment: additionalCommentsVal || null,
              currentLicenseCount: Number(currentLicenseCountVal || 0),
              currentUsageCount: Number(currentUsageCountVal || 0),
              currentUnits: currentUnitsVal || null,
              newLicenseCount: Number(newLicenseCountVal || 0),
              newUsageCount: Number(newUsageCountVal || 0),
              newUnits: newUnitsVal || null,
              dueDate: dueDateVal || null,
              renewalDate: renewalDateVal || null,
              licenseUpdateType: licenseUpdateTypeVal || null,
              existingContractId: existingContractIdVal || null,
              billingType: billingTypeVal || null,
            }),
          }
        );
      }

      addNotification({
        title: "Request status updated",
        message: `Request ${issueKey} moved successfully.`,
        issueKey: issueKey,
      });
    } catch (err) {
      console.error("Transition error:", err);
      alert("Failed to update issue status.");
    }
  };

  const renderCommentsTree = (
    nodes: Comment[],
    level: number = 0
  ): JSX.Element[] => {
    return nodes.map((comment) => (
      <div
        key={`comment-${comment.id}`}
        className="flex space-x-3"
        style={{ marginLeft: level * 24 }}
      >
        <div className="flex-shrink-0">
          <img
            className="w-8 h-8 rounded-full"
            src={comment.author.avatarUrls["48x48"]}
            alt={comment.author.displayName}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {comment.author.displayName}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(comment.created)}
            </span>
          </div>
          <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {typeof comment.body === "object"
              ? renderAdfContent(comment.body as unknown as AdfDocument)
              : comment.body}
          </div>

          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <button
              onClick={() => {
                setReplyingToCommentId(comment.id);
                setReplyText("");
              }}
              className="inline-flex items-center hover:text-blue-600 dark:hover:text-blue-400"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 10l9-7v4a9 9 0 019 9v1a1 1 0 01-1.447.894L18 17.618V16a7 7 0 00-7-7v4L3 10z"
                />
              </svg>
              Reply
            </button>
          </div>

          {replyingToCommentId === comment.id && (
            <div className="mt-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                rows={2}
                disabled={isAddingComment}
              />
              <div className="flex justify-end mt-1 space-x-2">
                <button
                  onClick={() => {
                    setReplyingToCommentId(null);
                    setReplyText("");
                  }}
                  className="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddReply(comment.id)}
                  disabled={!replyText.trim() || isAddingComment}
                  className="px-3 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingComment ? "Replying..." : "Reply"}
                </button>
              </div>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {renderCommentsTree(comment.replies, level + 1)}
            </div>
          )}
        </div>
      </div>
    ));
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

  return (
    <>
      <PageMeta
        title={
          selectedIssue ? `${selectedIssue.key} - Requests` : "Requests"
        }
        description="View all Requests"
      />
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Requests
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search Requests..."
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              aria-label="Filter by project"
              disabled
            >
              <option value="Request Management">Request Management</option>
            </select>

            <select
              className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              aria-label="Filter by assignee"
            >
              <option value="">All Assignees</option>
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.name}>
                  {assignee.name}
                </option>
              ))}
            </select>

            <select
              className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedIssueType}
              onChange={(e) => setSelectedIssueType(e.target.value)}
              aria-label="Filter by Request type"
            >
              <option value="">All Types</option>
              {issueTypes.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>

            <select
              className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.name}>
                  {status.name}
                </option>
              ))}
            </select>

            <CustomFilterDropdown
              customFields={customFields.map((field) => ({
                id: field.id,
                name: field.name,
              }))}
              onSortChange={handleSortChange}
              onAddFilter={handleAddFilter}
            />
          </div>
        </div>

        <div
          ref={splitViewRef}
          className="flex flex-1 overflow-hidden relative"
          style={{ cursor: isResizing ? "col-resize" : "default" }}
        >
          <div
            className="border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-800 relative"
            style={{ width: `${leftPanelWidth}%` }}
          >
            <div className="p-2">
              {filteredIssues.length > 0 ? (
                <div className="space-y-1">
                  {filteredIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => handleIssueClick(issue)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedIssue?.key === issue.key
                          ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {issue.fields.issuetype?.name && (
                          <IssueTypeIcon
                            type={issue.fields.issuetype.name}
                            size="sm"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {issue.key}
                            </span>
                            {issue.fields.status && (
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColorClass(
                                  issue.fields.status.name
                                )}`}
                              >
                                {issue.fields.status.name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white truncate">
                            {issue.fields.summary || "No summary"}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>{issue.fields.issuetype?.name}</span>
                            {issue.fields.assignee && (
                              <>
                                <span>•</span>
                                <span>
                                  {issue.fields.assignee.displayName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No issues found
                </div>
              )}
            </div>
          </div>

          <div
            className="w-2 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 cursor-col-resize flex items-center justify-center transition-colors"
            onMouseDown={handleMouseDown}
            style={{ zIndex: 10 }}
          >
            <div className="w-1 h-8 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          </div>

          <div
            className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900"
            style={{ width: `${100 - leftPanelWidth}%` }}
          >
            {selectedIssue ? (
              <div className="p-6">
                {/* Header */}
                <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {selectedIssue.fields.issuetype?.name && (
                          <IssueTypeIcon
                            type={selectedIssue.fields.issuetype.name}
                            size="lg"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1 mb-2">
                            <button
                              onClick={goToProjectIssues}
                              className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                              aria-label="Go back"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                ></path>
                              </svg>
                            </button>
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              ></path>
                            </svg>
                            <Link
                              to={`/project/${selectedIssue.fields.project?.key}`}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {selectedIssue.fields.project?.name}
                            </Link>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              /
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {selectedIssue.key}
                            </span>
                          </div>
                          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white break-words">
                            {selectedIssue.fields.summary}
                          </h1>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
                  <div className="flex flex-wrap gap-2">
                    {canEditIssue() && (
                      <button
                        onClick={handleEditIssue}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          ></path>
                        </svg>
                        Edit
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setActiveTab("comments");
                        setIsAddingComment(true);
                        setTimeout(() => {
                          const commentsSection =
                            document.getElementById("activity-section");
                          if (commentsSection)
                            commentsSection.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                        }, 100);
                      }}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        ></path>
                      </svg>
                      Comment
                    </button>

                    {/* Transition Dropdown */}
                    <div className="flex items-center gap-2">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => {
                            if (isTransitionDisabled) return;
                            setIsTransitionDropdownOpen(
                              !isTransitionDropdownOpen
                            );
                          }}
                          disabled={isTransitionDisabled}
                          className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full shadow-sm focus:outline-none ${
                            isTransitionDisabled
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          style={{
                            backgroundColor: getStatusColor(
                              selectedIssue?.fields?.status?.statusCategory
                                ?.colorName
                            ),
                            color: "white",
                          }}
                          title={
                            isTransitionDisabled
                              ? "Submit a Final Proposal before changing status"
                              : "Transition issue status"
                          }
                        >
                          <span>
                            {selectedIssue?.fields?.status?.name ||
                              "Select Status"}
                          </span>
                          <svg
                            className="w-4 h-4 ml-2 opacity-80"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {isTransitionDropdownOpen && (
                          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                            <div className="py-1 max-h-60 overflow-auto">
                              {customTransitions.length > 0 ? (
                                customTransitions.map(
                                  (transition: IssueTransition) => (
                                    <button
                                      key={transition.id}
                                      onClick={() => {
                                        setSelectedTransition(transition.id);
                                        setIsTransitionDropdownOpen(false);
                                        handleCustomTransition(transition.id);
                                      }}
                                      className={`flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${
                                        selectedTransition === transition.id
                                          ? "bg-blue-100 dark:bg-blue-900"
                                          : ""
                                      }`}
                                    >
                                      <span
                                        className="w-2.5 h-2.5 rounded-full mr-2"
                                        style={{
                                          backgroundColor: getStatusColor(
                                            transition.to?.statusCategory
                                              ?.colorName
                                          ),
                                        }}
                                      ></span>
                                      {transition.name}
                                    </button>
                                  )
                                )
                              ) : (
                                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                  No transitions available
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {userRole === "SUPER_ADMIN" &&
                      selectedIssue?.fields?.status?.name ===
                        "Negotiation Stage" && (
                        <button
                          onClick={() => setIsUploadQuoteModalOpen(true)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          Upload Quote
                        </button>
                      )}
                  </div>
                </div>

                {/* Details, Description, Attachments, Activity, etc. */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Details & Description */}
                  <div className="lg:col-span-2">
                    <div className="mb-6">
                      <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Details
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Vendor & Product */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            Vendor Name
                          </h4>
                          <div className="text-gray-900 dark:text-white">
                            {vendorNameVal || "-"}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            Product Name
                          </h4>
                          <div className="text-gray-900 dark:text-white">
                            {productNameVal || "-"}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            Billing Type
                          </h4>
                          <div className="text-gray-900 dark:text-white">
                            {billingTypeVal || "-"}
                          </div>
                        </div>

                        {isLicenseBilling && (
                          <>
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                Current License Count
                              </h4>
                              <div className="text-gray-900 dark:text-white">
                                {currentLicenseCountVal || "-"}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                Current Units
                              </h4>
                              <div className="text-gray-900 dark:text-white">
                                {currentUnitsVal || "-"}
                              </div>
                            </div>
                          </>
                        )}

                        {isUsageBilling && (
                          <>
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                Current Usage Count
                              </h4>
                              <div className="text-gray-900 dark:text-white">
                                {currentUsageCountVal || "-"}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                Current Units
                              </h4>
                              <div className="text-gray-900 dark:text-white">
                                {currentUnitsVal || "-"}
                              </div>
                            </div>
                          </>
                        )}

                        {isLicenseBilling && isUpgradeOrDowngrade && (
                          <>
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                New License Count
                              </h4>
                              <div className="text-gray-900 dark:text-white">
                                {newLicenseCountVal || "-"}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                New Units
                              </h4>
                              <div className="text-gray-900 dark:text-white">
                                {newUnitsVal || "-"}
                              </div>
                            </div>
                          </>
                        )}

                        {isUsageBilling && isUpgradeOrDowngrade && (
                          <>
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                New Usage Count
                              </h4>
                              <div className="text-gray-900 dark:text-white">
                                {newUsageCountVal || "-"}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                New Units
                              </h4>
                              <div className="text-gray-900 dark:text-white">
                                {newUnitsVal || "-"}
                              </div>
                            </div>
                          </>
                        )}

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            Department
                          </h4>
                          <div className="text-gray-900 dark:text-white">
                            {departmentVal || "-"}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            Organization
                          </h4>
                          <div className="text-gray-900 dark:text-white">
                            {organizationVal || "-"}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            Contract Type
                          </h4>
                          <div className="text-gray-900 dark:text-white">
                            {contractTypeVal || "-"}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            License Update Type
                          </h4>
                          <div className="text-gray-900 dark:text-white">
                            {licenseUpdateTypeVal || "-"}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            Existing Contract ID
                          </h4>
                          <div className="text-gray-900 dark:text-white">
                            {existingContractIdVal || "-"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Description
                        </h2>
                      </div>
                      <div className="prose max-w-none">
                        {selectedIssue.fields.description ? (
                          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {typeof selectedIssue.fields.description ===
                            "object"
                              ? renderAdfContent(
                                  selectedIssue.fields
                                    .description as AdfDocument
                                )
                              : selectedIssue.fields.description}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 italic">
                            No description provided
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Attachments */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          ></path>
                        </svg>
                        Attachments
                      </h2>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      {attachments && attachments.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => {
                                const url = attachment.fileUrl;
                                if (!url) return;

                                if (
                                  (attachment.mimeType ||
                                    attachment.fileUrl
                                  )?.startsWith("image/")
                                ) {
                                  // if you have a previewAttachment state, use it here
                                  window.open(url, "_blank");
                                } else {
                                  window.open(url, "_blank");
                                }
                              }}
                            >
                              {(attachment.mimeType ||
                                attachment.fileUrl
                              )?.startsWith("image/") ? (
                                <img
                                  src={attachment.fileUrl}
                                  alt={
                                    attachment.fileName || attachment.filename
                                  }
                                  className="w-full h-32 object-cover hover:scale-105 transition-transform duration-200"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center h-32 bg-gray-100 dark:bg-gray-700">
                                  <svg
                                    className="w-8 h-8 text-gray-500 dark:text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M12 11V3m0 0L8 7m4-4l4 4m0 4v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6m8 0H8"
                                    ></path>
                                  </svg>
                                  <span className="text-xs mt-2 text-gray-600 dark:text-gray-300 truncate w-24 text-center">
                                    {attachment.fileName || attachment.filename}
                                  </span>
                                </div>
                              )}
                              <div className="p-2 text-center border-t border-gray-200 dark:border-gray-600">
                                <a
                                  href={attachment.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View / Download
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                          <svg
                            className="w-12 h-12 mx-auto text-gray-400 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                          </svg>
                          <p className="mt-2">No attachments yet</p>
                        </div>
                      )}
                    </div>

                    {/* Activity / Comments */}
                    <div id="activity-section">
                      <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Comments
                        </h2>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg">
                        {activeTab === "comments" && (
                          <div className="p-4">
                            {additionalCommentsVal ? (
                              <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                  Additional Comments
                                </h4>
                                <div className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
                                  {additionalCommentsVal}
                                </div>
                              </div>
                            ) : null}

                            {/* Comment Input Box */}
                            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                              <div className="flex items-start space-x-3">
                                <img
                                  className="w-8 h-8 rounded-full"
                                  src="https://via.placeholder.com/48"
                                  alt="Current User"
                                />
                                <div className="flex-1">
                                  <textarea
                                    value={newComment}
                                    onChange={(e) =>
                                      setNewComment(e.target.value)
                                    }
                                    placeholder="Add a comment..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                                    rows={3}
                                    disabled={isAddingComment}
                                  />
                                  <div className="flex justify-end mt-2">
                                    <button
                                      onClick={handleAddComment}
                                      disabled={
                                        !newComment.trim() || isAddingComment
                                      }
                                      className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isAddingComment
                                        ? "Sending..."
                                        : "Send"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Comments List */}
                            {comments.length > 0 ? (
                              <div className="space-y-4">
                                {renderCommentsTree(comments)}
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                No comments yet
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - People & Dates */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* People */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 dark:text:white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                        People
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            Requester Name
                          </h4>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {requesterNameVal ||
                              selectedIssue.fields.reporter?.displayName ||
                              "-"}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            Requester Email
                          </h4>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {requesterEmailVal || "-"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                        Dates
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            Due Date
                          </h4>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {dueDateVal || "-"}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            Renewal Date
                          </h4>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {calculateRenewalDate()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                  <p className="text-lg">Select an issue to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PROPOSAL PREVIEW MODAL */}
      {previewProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {previewProposal.proposalType} Proposal Preview
              </h3>
              <button
                onClick={() => setPreviewProposal(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-sm text-gray-500">License / Usage Count</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {previewProposal.licenseCount}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Unit Cost</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ₹ {previewProposal.unitCost.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Total Cost</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ₹ {previewProposal.totalCost.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Comment</p>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {previewProposal.comment || "-"}
                </p>
              </div>

              {previewProposal.final && proposals.length > 1 && (
                <div className="p-4 mt-4 bg-yellow-100 dark:bg-yellow-700 rounded-md border border-yellow-400">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
                    Profit Comparison
                  </h4>

                  {(() => {
                    const sorted = [...proposals].sort(
                      (a, b) => a.proposalNumber - b.proposalNumber
                    );

                    const finalProposal = sorted[sorted.length - 1];
                    const lastNormal = sorted[sorted.length - 2];

                    const profit =
                      Number(lastNormal.totalCost || 0) -
                      Number(finalProposal.totalCost || 0);

                    return (
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                          Previous Proposal Total:{" "}
                          <strong>
                            ₹ {lastNormal.totalCost.toLocaleString()}
                          </strong>
                        </p>

                        <p className="text-sm text-gray-700 dark:text-gray-200">
                          Final Proposal Total:{" "}
                          <strong>
                            ₹ {finalProposal.totalCost.toLocaleString()}
                          </strong>
                        </p>

                        <p className="text-lg mt-2 font-bold text-blue-700 dark:text-blue-300">
                          Profit: ₹ {profit.toLocaleString()}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setPreviewProposal(null)}
                className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 dark:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD QUOTE MODAL */}
      {isUploadQuoteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-99999 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upload Quote
              </h3>
              <button
                onClick={() => setIsUploadQuoteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                  Proposal Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentProposal("first")}
                    className={`p-3 rounded border text-center ${
                      currentProposal === "first"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    First Proposal
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentProposal("second")}
                    className={`p-3 rounded border text-center ${
                      currentProposal === "second"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    Second Proposal
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentProposal("third")}
                    className={`p-3 rounded border text-center ${
                      currentProposal === "third"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    Third Proposal
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentProposal("final")}
                    className={`p-3 rounded border text-center ${
                      currentProposal === "final"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    Final Proposal
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                  License/Usage Count
                </label>
                <input
                  type="number"
                  value={editableLicenseCount}
                  onChange={(e) => setEditableLicenseCount(e.target.value)}
                  className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
                  placeholder="Enter license or usage count"
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                  Unit Cost
                </label>
                <input
                  type="number"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
                  placeholder="Enter unit cost"
                />
              </div>

              <div>
                <p className="text-sm text-gray-500">Total Cost</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-300">
                  ₹ {totalCost.toLocaleString()}
                </p>
              </div>

              {currentProposal === "final" && proposals.length > 0 && (
                <div className="p-4 bg-yellow-100 dark:bg-yellow-700 rounded-md border border-yellow-400">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
                    Profit Calculation
                  </h4>
                  {(() => {
                    const sortedProposals = [...proposals].sort(
                      (a, b) => a.proposalNumber - b.proposalNumber
                    );
                    const lastProposal =
                      sortedProposals[sortedProposals.length - 1];

                    const lastTotalCost = Number(lastProposal.totalCost || 0);
                    const currentTotalCost = Number(totalCost || 0);
                    const profit = lastTotalCost - currentTotalCost;

                    return (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                          Previous Proposal Total:{" "}
                          <strong>
                            ₹ {lastTotalCost.toLocaleString()}
                          </strong>
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                          Final Proposal Total:{" "}
                          <strong>
                            ₹ {currentTotalCost.toLocaleString()}
                          </strong>
                        </p>
                        <p className="text-lg mt-2 font-bold text-blue-700 dark:text-blue-300">
                          Profit: ₹ {profit.toLocaleString()}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                  Comment
                </label>
                <textarea
                  value={proposalComment}
                  onChange={(e) => setProposalComment(e.target.value)}
                  className="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Enter your comment"
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
                  Attach Quote Files
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setQuoteAttachments(Array.from(e.target.files));
                    }
                  }}
                  className="w-full"
                />
              </div>

              <div className="mt-6">
                <h2 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                  Previous Proposals
                </h2>

                {isLoadingProposals ? (
                  <p className="text-gray-500 dark:text-gray-400">
                    Loading proposals...
                  </p>
                ) : proposals.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    No proposals yet.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {proposals.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {p.proposalType} Proposal #{p.proposalNumber}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(p.createdAt).toLocaleString()}
                            </p>
                          </div>

                          <button
                            onClick={() => handlePreviewProposal(p.id)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Preview
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">
                              License Count
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {p.licenseCount}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-500 dark:text-gray-400">
                              Unit Cost
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              ₹ {p.unitCost}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-500 dark:text-gray-400">
                              Total Cost
                            </p>
                            <p className="font-bold text-green-600 dark:text-green-400">
                              ₹ {p.totalCost}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-500 dark:text-gray-400">
                              Comment
                            </p>
                            <p className="text-gray-900 dark:text-white">
                              {p.comment || "-"}
                            </p>
                          </div>
                        </div>

                        {p.final && proposals.length > 1 && (
                          <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-700 rounded border border-yellow-400">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                              Profit Calculation
                            </h4>

                            {(() => {
                              const sorted = [...proposals].sort(
                                (a, b) => a.proposalNumber - b.proposalNumber
                              );

                              const finalP = sorted[sorted.length - 1];
                              const lastP = sorted[sorted.length - 2];
                              const profit =
                                Number(lastP.totalCost) -
                                Number(finalP.totalCost);

                              return (
                                <div className="mt-1 text-sm">
                                  <p>Prev Total: ₹ {lastP.totalCost}</p>
                                  <p>Final Total: ₹ {finalP.totalCost}</p>
                                  <p className="font-bold text-blue-800 dark:text-blue-300 mt-1">
                                    Profit: ₹ {profit}
                                  </p>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setIsUploadQuoteModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded dark:bg-gray-600 dark:text-white"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmitQuote}
                disabled={isSubmittingQuote}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmittingQuote ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Issue Modal */}
      {selectedIssue && (
        <EditIssueModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={async (issueIdOrKey: string, issueData: any) => {
            try {
              await jiraService.updateIssue(issueIdOrKey, issueData);
              const updatedIssue = await jiraService.getIssueByIdOrKey(
                issueIdOrKey
              );
              setSelectedIssue(updatedIssue);
              setIsEditModalOpen(false);
              alert("Issue updated successfully");
            } catch (error) {
              console.error("Error updating issue:", error);
              alert("Failed to update issue");
            }
          }}
          issue={convertIssueForEditModal(selectedIssue)}
        />
      )}
    </>
  );
};

export default RequestSplitView;