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
import AttachmentPreview from "../components/AttachmentPreview";

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
  // Local attachment fields
  localAttachmentId?: number;
  hasLocalCopy?: boolean;
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
  console.log('🧭 issueKey from useParams:', issueKey);
  const { userRole, canAccessDepartmentIssues } = usePermissions();

  // Get current user information from AuthContext
  const { userData } = useAuth();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Debug selectedIssue changes
  useEffect(() => {
    console.log('🔄 selectedIssue changed:', selectedIssue?.key || 'null');
  }, [selectedIssue]);

  // helper to read fields
  const getFieldValue = (keys: string[]) => {
    if (!selectedIssue) return "";
    
    // Debug: Log all available fields when trying to access customfield_10471
    if (keys.includes('customfield_10471')) {
      console.log('🔍 Checking for customfield_10471 in issue', selectedIssue.key);
      
      // Log all field keys to see what's available
      if (selectedIssue.fields) {
        const allFieldKeys = Object.keys(selectedIssue.fields);
        console.log('📊 Total fields available:', allFieldKeys.length);
        console.log('📋 Custom field sample:', allFieldKeys.filter(k => k.startsWith('customfield_')).slice(0, 20));
        
        // Check specifically for customfield_10471
        const hasOptimizedCostField = 'customfield_10471' in selectedIssue.fields;
        console.log('🎯 customfield_10471 exists:', hasOptimizedCostField);
        
        if (hasOptimizedCostField) {
          const value = selectedIssue.fields['customfield_10471'];
          console.log('💰 customfield_10471 value:', value);
          console.log('typeof value:', typeof value);
        } else {
          // Let's see if it's just missing or if there's a pattern
          const similarFields = allFieldKeys.filter(k => k.includes('104'));
          console.log('🔎 Similar field IDs:', similarFields);
        }
      } else {
        console.log('❌ No fields object available');
      }
    }
    
    for (const k of keys) {
      const val = selectedIssue.fields?.[k];
      // Debug log for field value retrieval
      console.log(`Getting field value for key: ${k}`, val);
      console.log(`Value type for ${k}:`, typeof val);
      console.log(`Value null/undefined check for ${k}:`, val == null);
      
      if (val !== undefined && val !== null && val !== "") {
        if (typeof val === "object") {
          if ("value" in val && (val as any).value) return String((val as any).value);
          if ("displayName" in val && (val as any).displayName)
            return String((val as any).displayName);
          if (Array.isArray(val) && typeof val[0] === "string") return val[0];
          return JSON.stringify(val);
        }
        return String(val);
      } else {
        console.log(`Field ${k} is empty/null/undefined`);
      }
    }
    console.log('No valid field values found, returning empty string');
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
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
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

  // Track which proposals have been submitted
  const [submittedProposals, setSubmittedProposals] = useState<Record<string, boolean>>({
    first: false,
    second: false,
    third: false,
    final: false
  });

  // Track if total optimized cost has been submitted
  const [hasSubmittedTotalOptimizedCost, setHasSubmittedTotalOptimizedCost] = useState(false);
  
  // Store the total optimized cost fetched from backend
  const [totalProfit, setTotalProfit] = useState<number | null>(null);
  const [unitCost, setUnitCost] = useState("");
  const [editableLicenseCount, setEditableLicenseCount] = useState(
    getFieldValue(["customfield_10293", "customfield_10294"]) || "0"
  );
  const totalCost = Number(editableLicenseCount || 0) * Number(unitCost || 0);

  const [proposalComment, setProposalComment] = useState("");

  const [quoteAttachments, setQuoteAttachments] = useState<File[]>([]);

  const [hasSubmittedFinalQuote, setHasSubmittedFinalQuote] = useState(false);
  const previousIssueKeyRef = useRef<string | null>(null);

  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  const [previewProposal, setPreviewProposal] =
    useState<ContractProposalDto | null>(null);

  const [leftPanelWidth, setLeftPanelWidth] = useState(30);
  const [isResizing, setIsResizing] = useState(false);
  const splitViewRef = useRef<HTMLDivElement>(null);

  const isInNegotiationStage =
    selectedIssue?.fields?.status?.name === "Negotiation Stage";

  // Load proposals when modal opens
  useEffect(() => {
    if (isUploadQuoteModalOpen && issueKeyFromParams) {
      loadProposals(issueKeyFromParams);
    }
  }, [isUploadQuoteModalOpen, issueKeyFromParams]);

  // Reset optimized cost state when selected issue changes
  useEffect(() => {
    console.log('🔄 useEffect triggered, selectedIssue:', selectedIssue?.key);
    console.log('👤 User role:', userRole);
    console.log('✅ Has submitted final quote:', hasSubmittedFinalQuote);
    
    // Only reset hasSubmittedFinalQuote if we're loading a new issue (not when refreshing same issue)
    const currentIssueKey = selectedIssue?.key || null;
    
    // Only reset if we had a previous issue and it's different from current issue
    // But don't reset if currentIssueKey is null (issue not loaded yet)
    if (currentIssueKey !== null && previousIssueKeyRef.current !== null && currentIssueKey !== previousIssueKeyRef.current) {
      console.log('🔄 New issue selected, resetting hasSubmittedFinalQuote');
      console.log('🔧 Setting hasSubmittedFinalQuote to false (new issue)');
      setHasSubmittedFinalQuote(false);
    } else {
      console.log('🔄 Same issue, initial load, or issue not loaded yet, keeping hasSubmittedFinalQuote state');
    }
    
    // Only update the ref if we have a valid issue key
    if (currentIssueKey !== null) {
      previousIssueKeyRef.current = currentIssueKey;
    }
    
    setTotalProfit(null);
    
    // Fetch optimized cost data for the selected issue
    if (selectedIssue?.key) {
      console.log('🚀 Calling refreshOptimizedCostData from useEffect for issue:', selectedIssue.key);
      refreshOptimizedCostData();
    } else {
      console.log('⚠️ No selectedIssue.key, skipping refreshOptimizedCostData');
    }
  }, [selectedIssue?.key]);
  
  // Initialize ref with issue key from URL params
  useEffect(() => {
    if (issueKeyFromParams) {
      previousIssueKeyRef.current = issueKeyFromParams;
      console.log('🔧 Initialized previousIssueKeyRef with:', issueKeyFromParams);
    }
  }, []);
  
  // Debug effect to monitor when Total Optimized Cost section conditions change
  useEffect(() => {
    console.log('🔍 Total Optimized Cost conditions changed:', { 
      hasSubmittedFinalQuote, 
      userRole, 
      shouldShow: hasSubmittedFinalQuote && userRole === "SUPER_ADMIN",
      totalProfit
    });
  }, [hasSubmittedFinalQuote, userRole, totalProfit]);
  
  // Debug the hasSubmittedFinalQuote state
  useEffect(() => {
    console.log('📊 hasSubmittedFinalQuote state changed:', hasSubmittedFinalQuote);
  }, [hasSubmittedFinalQuote]);
  
  // Debug effect to monitor hasSubmittedFinalQuote changes
  useEffect(() => {
    console.log('🔄 hasSubmittedFinalQuote changed:', hasSubmittedFinalQuote);
  }, [hasSubmittedFinalQuote]);

  // Reset form fields when switching between proposals
  useEffect(() => {
    // Reset form fields when proposal changes
    setUnitCost("");
    setProposalComment("");
    setQuoteAttachments([]);
    
    // Reset license count to default value when switching proposals
    setEditableLicenseCount("0");
  }, [currentProposal]);

  // Disable status transitions while in Negotiation Stage until a final proposal is submitted,
  // regardless of user role
  const isTransitionDisabled =
    isInNegotiationStage && !hasSubmittedFinalQuote;

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
    console.log('📥 fetchIssueDetails called for issue:', issueKey);
    // Ensure we have a valid issue key before proceeding
    if (!issueKey || issueKey === 'undefined') {
      console.warn('Attempted to fetch issue details with invalid issue key:', issueKey);
      return;
    }
    
    try {
      // Load existing proposals for this issue
      await loadProposals(issueKey);
      // Fetch comments using our custom comment service
      const commentsResponse = await commentService.getCommentsByIssueKey(
        issueKey
      );
      const customComments = commentsResponse.comments || [];

      // Recursive mapper: backend CommentDto -> UI Comment
      const mapDtoToUiComment = (dto: any): Comment => {
        // Get avatar from the comment's user, otherwise use default
        let avatarUrl = "https://via.placeholder.com/48";
        if (dto.userAvatar) {
          avatarUrl = dto.userAvatar;
        }

        return {
          id: dto.id.toString(),
          author: {
            displayName: dto.userName,
            avatarUrls: { "48x48": avatarUrl },
          },
          body: dto.commentText,
          created: dto.createdAt,
          updated: dto.updatedAt || dto.createdAt,
          parentCommentId: dto.parentCommentId ?? null,
          replies: (dto.replies || []).map(mapDtoToUiComment),
        };
      }

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

      // TODO: Fetch attachments directly from Jira since we're not saving to our database
      // This is the new approach to avoid database errors
      
      // Fetch attachments directly from Jira
      let attachmentsData = [];
      try {
        const jiraAttachments = await jiraService.getIssueAttachments(issueKey);
        attachmentsData = Array.isArray(jiraAttachments) ? jiraAttachments : 
                        (jiraAttachments && jiraAttachments.attachments) ? jiraAttachments.attachments : [];
      } catch (jiraError: any) {
        console.warn('Failed to fetch attachments from Jira:', jiraError);
        // Show user-friendly error message for common issues
        if (jiraError.message && jiraError.message.includes('404')) {
          console.warn(`Issue ${issueKey} not found in Jira or you don't have permission to access it`);
        } else if (jiraError.message && jiraError.message.includes('connect')) {
          console.warn('Unable to connect to Jira API');
        }
        attachmentsData = [];
      }
      
      // Removed local database fetch since we're now using Jira exclusively for attachments
      // All attachment data will come directly from Jira
      
      const transformedAttachments: Attachment[] = (attachmentsData || []).map(
        (attachment: any) => {
          return {
            id: attachment.id?.toString() || "",
            filename: attachment.fileName || attachment.filename || "Unknown file",
            content: attachment.fileUrl || attachment.content || "",
            size: attachment.fileSize || attachment.size || 0,
            mimeType: attachment.mimeType || attachment.mimeType || "",
            created:
              attachment.uploadedAt ||
              attachment.created ||
              new Date().toISOString(),
            fileName: attachment.fileName || attachment.filename,
            // Use Jira's content URL for fileUrl to enable direct preview
            fileUrl: attachment.content || attachment.fileUrl || 
                     (attachment.id ? `http://localhost:8080/api/jira/attachment/content/${attachment.id}` : ""),
            fileSize: attachment.fileSize || attachment.size,
            uploadedBy: attachment.uploadedBy || "Unknown",
            stage: attachment.stage || "Unknown",
            uploadedAt: attachment.uploadedAt || attachment.created || new Date().toISOString(),
            jiraIssueKey: attachment.jiraIssueKey || issueKey,
            proposalId: attachment.proposalId || null,
            localAttachmentId: null,
            // Since we're not saving local copies anymore, always allow preview
            hasLocalCopy: true
          };
        }
      );

      setAttachments(transformedAttachments);

      // Skip automatic optimized cost data fetching to prevent repeated server errors
      // Users can manually refresh if needed using the retry button

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
    console.log('📥 loadProposals called for issue:', issueKey);
    try {
      setIsLoadingProposals(true);
      const res = await fetch(
        `http://localhost:8080/api/jira/proposals/issue/${issueKey}`
      );

      if (!res.ok) {
        throw new Error("Failed to load proposals");
      }
      const data: ContractProposalDto[] = await res.json();
      console.log('📥 Loaded proposals for issue:', issueKey, data);
      setProposals(data || []);

      // Update submitted proposals state based on loaded data
      const submitted: Record<string, boolean> = {
        first: false,
        second: false,
        third: false,
        final: false
      };

      data.forEach(proposal => {
        // Map proposal types to our state keys
        // Handle both the new explicit types and the old generic types
        const typeMap: Record<string, string> = {
          "FIRST": "first",
          "SECOND": "second",
          "THIRD": "third",
          "FINAL": "final",
          "PROPOSAL 1": "first",
          "PROPOSAL 2": "second",
          "PROPOSAL 3": "third"
        };
        
        const key = typeMap[proposal.proposalType];
        if (key) {
          submitted[key] = true;
        } else if (proposal.final) {
          // If it's marked as final but doesn't match our explicit types
          submitted.final = true;
        }
      });

      setSubmittedProposals(submitted);

      // If any proposal is final → allow transition from negotiation
      const hasBackendFinal = (data || []).some((p) => p.final);
      const hasTypeFinal = submitted.final;
      const hasFinal = hasBackendFinal || hasTypeFinal;
      console.log('🔍 Checking for final proposals in loaded data:', { hasBackendFinal, hasTypeFinal, hasFinal, dataLength: data?.length || 0 });
      // Only set hasSubmittedFinalQuote to false if it's currently false or if there are no final proposals
      // This prevents resetting the state when a final proposal has been submitted but not yet reflected in backend
      setHasSubmittedFinalQuote(prev => {
        const newValue = prev || hasFinal;
        console.log('🔄 Updating hasSubmittedFinalQuote:', { prev, hasFinal, newValue });
        return newValue;
      });

      // Skip automatic optimized cost data fetching to prevent repeated server errors
      // Users can manually refresh if needed using the retry button
    } catch (err) {
      console.error("Error loading proposals:", err);
      setProposals([]);
      console.log('🔧 Setting hasSubmittedFinalQuote to false (error loading proposals)');
      setHasSubmittedFinalQuote(false);
      // Reset submitted proposals on error
      setSubmittedProposals({
        first: false,
        second: false,
        third: false,
        final: false
      });
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

  const selectedIssueKey = selectedIssue?.key;

  useEffect(() => {
    console.log('📥 useEffect triggered to fetch issue details, selectedIssue:', selectedIssueKey);
    if (selectedIssueKey) {
      console.log('📥 Calling fetchIssueDetails for issue:', selectedIssueKey);
      fetchIssueDetails(selectedIssueKey);
    }
  }, [selectedIssueKey]);

  useEffect(() => {
    if (selectedIssue?.key) {
      // placeholder for transitions if needed
    }
  }, [selectedIssue]);

  // initial fetch for projects/issues/etc.
  useEffect(() => {
    console.log('📥 Initial fetch useEffect triggered, issueKey:', issueKey);
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const projectsData = await jiraService.getAllProjects();
        
        // Ensure projectsData is an array before filtering
        const projectsArray = Array.isArray(projectsData) ? projectsData : 
                             (projectsData && typeof projectsData === 'object' && 'projects' in projectsData) ? projectsData.projects : [];
        
        if (!Array.isArray(projectsArray)) {
          console.error('Unexpected projects data format:', projectsData);
          throw new Error('Invalid projects data received from server');
        }
        
        const validProjects = projectsArray
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

        console.log('📥 Fetched all issues count:', allIssues.length);
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
          console.log('🔍 Looking for issue in allIssues, issueKey:', issueKey);
          console.log('📋 allIssues length:', allIssues.length);
          const foundIssue =
            allIssues.find((issue) => issue.key === issueKey) || null;
          console.log('🔍 Found issue:', foundIssue);
          setSelectedIssue(foundIssue);
          if (foundIssue)
            setSelectedStatus(foundIssue.fields.status?.name || "");
        } else {
          console.log('⚠️ No issueKey, setting selectedIssue to null');
          setSelectedIssue(null);
        }
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
    console.log('📥 Fetch full issue useEffect triggered, issueKey:', issueKey);
    // Ensure we have a valid issue key before proceeding
    if (!issueKey || issueKey === 'undefined') {
      console.log('⚠️ Invalid issueKey, returning early');
      return;
    }
    
    console.log('📥 About to call loadFullIssue, issueKey:', issueKey);

    const loadFullIssue = async () => {
      console.log('📥 loadFullIssue called, issueKey:', issueKey);
      try {
        const fullIssue = await jiraService.getIssueByIdOrKey(issueKey);
        console.log('📥 Received fullIssue:', fullIssue?.key);
        setSelectedIssue(fullIssue);
      } catch (err: any) {
        console.error("Error loading full issue:", err);
        // Show user-friendly error message
        if (err.message && err.message.includes('connect')) {
          alert('Unable to connect to Jira. Please check your internet connection and try again.');
        } else if (err.message && err.message.includes('Failed to fetch issue')) {
          alert(`Error loading issue details: ${err.message}`);
        } else if (err.message && err.message.includes('404')) {
          console.warn(`Issue ${issueKey} not found in Jira or you don't have permission to access it`);
          alert(`Issue ${issueKey} not found or you don't have permission to access it.`);
        } else {
          alert('Failed to load issue details. Please try again later.');
        }
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
    console.log('🔧 Setting hasSubmittedFinalQuote to false (handleIssueClick)');
    setHasSubmittedFinalQuote(false);
    previousIssueKeyRef.current = issue.key;
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

  // Map Jira-like status names to attractive, distinct color chips (similar to Jira)
  const getStatusColorClass = (statusName?: string) => {
    const map: Record<string, string> = {
      // Draft / early
      "Request Created":
        "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      "Pre-Approval":
        "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
      "Request Review":
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      // Negotiation / in progress
      "Negotiation Stage":
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "In Progress":
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      // Approved / done
      "Post Approval":
        "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
      Completed:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      // Negative / declined
      Declined:
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "On Hold":
        "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    };

    return (
      map[statusName || ""] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    );
  };

  // Solid color for status badges & transition dots
  const getStatusColor = (statusNameOrCategory?: string) => {
    const byStatusName: Record<string, string> = {
      "Request Created": "#6B778C", // neutral gray
      "Pre-Approval": "#0C66E4", // sky/blue
      "Request Review": "#0052CC", // Jira blue
      "Negotiation Stage": "#6554C0", // purple
      "In Progress": "#4C6FFF", // indigo
      "Post Approval": "#1F845A", // teal/green
      Completed: "#22A06B", // green
      Done: "#22A06B",
      Declined: "#E34935", // red
      "On Hold": "#B06500", // amber
    };

    const byCategory: Record<string, string> = {
      "blue-gray": "#42526E",
      "medium-gray": "#97A0AF",
      yellow: "#FFC400",
      green: "#36B37E",
      blue: "#0052CC",
      brown: "#B06500",
      "warm-red": "#DE350B",
      purple: "#6554C0",
    };

    const key = statusNameOrCategory || "";
    return byStatusName[key] || byCategory[key] || "#A5ADBA";
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
        });

        // Get avatar from response if available, otherwise use default
        let avatarUrl = "https://via.placeholder.com/48";
        if (response.userAvatar) {
          avatarUrl = response.userAvatar;
        } else if (userData && userData.user && userData.user.avatar) {
          avatarUrl = userData.user.avatar;
        }

        const comment: Comment = {
          id: response.id.toString(),
          author: {
            displayName: response.userName || userData.user.name,
            avatarUrls: {
              "48x48": avatarUrl,
            },
          },
          body: response.commentText || newComment,
          created: response.createdAt || new Date().toISOString(),
          updated:
            response.updatedAt ||
            response.createdAt ||
            new Date().toISOString(),
          parentCommentId: response.parentCommentId ? Number(response.parentCommentId) : null,
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

      // Get avatar from response if available, otherwise use default
      let avatarUrl = "https://via.placeholder.com/48";
      if (response.userAvatar) {
        avatarUrl = response.userAvatar;
      } else if (userData && userData.user && userData.user.avatar) {
        avatarUrl = userData.user.avatar;
      }

      const replyComment: Comment = {
        id: response.id.toString(),
        author: {
          displayName: response.userName || userData.user.name,
          avatarUrls: {
            "48x48": avatarUrl,
          },
        },
        body: response.commentText || replyText,
        created: response.createdAt || new Date().toISOString(),
        updated:
          response.updatedAt ||
          response.createdAt ||
          new Date().toISOString(),
        parentCommentId: response.parentCommentId ? Number(response.parentCommentId) : Number(parentId),
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
    
    // Get issue organization and department
    const issueOrganization = getFieldValue(["customfield_10337"]); // Organization field
    const issueDepartment = getFieldValue(["customfield_10244"]); // Department field
    
    // Get user organization and department
    const userOrganization = userData?.organization?.name || null;
    const userDepartment = userData?.department?.name || null;

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

    // Define role-based transition permissions according to requirements
    const canTransition = (): boolean => {
      // Super Admin can transition regardless of organization/department
      if (role === "SUPER_ADMIN") {
        switch (currentStatus) {
          case "Request Created":
          case "Pre-Approval":
          case "Pre-approval":
          case "Request Review Stage":
          case "Negotiation Stage":
          case "Post Approval":
            return true;
          default:
            return false;
        }
      }
      
      // For other roles, check organization and department matching
      const orgMatch = !issueOrganization || !userOrganization || issueOrganization === userOrganization;
      const deptMatch = !issueDepartment || !userDepartment || issueDepartment === userDepartment;
      
      // If either organization or department doesn't match, no transitions allowed
      if (!orgMatch || !deptMatch) {
        return false;
      }
      
      switch (currentStatus) {
        case "Request Created":
          // Only APPROVER and ADMIN can transition (SUPER_ADMIN handled above)
          return role === "APPROVER" || role === "ADMIN";
          
        case "Pre-Approval":
        case "Pre-approval":
          // Only ADMIN can transition
          return role === "ADMIN";
          
        case "Request Review Stage":
          // Only ADMIN can transition
          return role === "ADMIN";
          
        case "Negotiation Stage":
          // Only SUPER_ADMIN can transition (handled above)
          return false;
          
        case "Post Approval":
          // APPROVER and ADMIN can transition (SUPER_ADMIN handled above)
          return role === "APPROVER" || role === "ADMIN";
          
        default:
          // REQUESTER can only view, no transitions
          return false;
      }
    };

    // Define available transitions based on current status
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

    // Return transitions only if user has permission
    if (canTransition()) {
      return transitions;
    } else {
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
  
  // Debug: Log the field values for troubleshooting
  useEffect(() => {
    if (selectedIssue) {
      console.log('Issue fields for debugging:', selectedIssue.fields);
      console.log('Current Units field value:', selectedIssue.fields?.["customfield_10295"]);
    }
  }, [selectedIssue]);

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

    // Check if this proposal type has already been submitted
    if (submittedProposals[currentProposal]) {
      alert(`The ${currentProposal} proposal has already been submitted. Please select a different proposal type.`);
      return;
    }

    // Check if final proposal is already submitted
    if (hasSubmittedFinalQuote) {
      alert("The final proposal has already been submitted. Please use the final submit button.");
      return;
    }

    // Check if trying to submit a proposal when final is already submitted
    if (currentProposal !== "final" && submittedProposals.final) {
      alert("The final proposal has already been submitted. No further proposals can be submitted.");
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
        console.log('🔧 Setting hasSubmittedFinalQuote to true in handleSubmitQuote (isFinal)');
        setHasSubmittedFinalQuote(true);

        // Calculate total optimized cost before saving
        let calculatedTotalOptimizedCost = 0;
        if (proposals.length > 0) {
          // Find the last submitted non-final proposal based on user's path
          let lastNonFinalProposal = null;
          const sortedProposals = [...proposals]
            .filter(p => !p.final)
            .sort((a, b) => a.proposalNumber - b.proposalNumber);
          
          // Get the last non-final proposal (user's path)
          if (sortedProposals.length > 0) {
            lastNonFinalProposal = sortedProposals[sortedProposals.length - 1];
          }

          const lastTotalCost = lastNonFinalProposal 
            ? Number(lastNonFinalProposal.totalCost || 0)
            : 0;
          const currentTotalCost = Number(totalCost || 0);
          calculatedTotalOptimizedCost = lastTotalCost - currentTotalCost;
        }

        // Set the total optimized cost state
        setTotalProfit(calculatedTotalOptimizedCost);

        // Save total optimized cost along with license count
        try {
          // Log the payload for debugging
          // Ensure editableLicenseCount is a number
          const licenseCountValue = typeof editableLicenseCount === 'string' ? 
            parseInt(editableLicenseCount, 10) : editableLicenseCount;
          
          // Validate required fields
          if (!issueKey) {
            console.warn('Cannot update license count: issueKey is missing');
            return;
          }
          
          if (licenseCountValue === null || licenseCountValue === undefined || isNaN(licenseCountValue)) {
            console.warn('Cannot update license count: invalid license count value', editableLicenseCount);
            return;
          }
          
          const payload = {
            issueKey,
            newLicenseCount: licenseCountValue,
            licenseCount: licenseCountValue,  // Alternative field name
            totalProfit: calculatedTotalOptimizedCost
          };
          console.log('Sending update-license-count request with payload:', payload);
          
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/jira/contracts/update-license-count`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          );
          
          if (!response.ok) {
            // Try to get error details from response
            let errorDetails = '';
            try {
              const errorData = await response.json();
              errorDetails = JSON.stringify(errorData, null, 2);
            } catch (parseError) {
              try {
                const text = await response.text();
                errorDetails = text || `${response.status} ${response.statusText}`;
              } catch (textError) {
                errorDetails = `${response.status} ${response.statusText}`;
              }
            }
            console.warn('Failed to update license count: Server returned', response.status, response.statusText, 'Details:', errorDetails);
            alert(`Failed to update license count: ${response.status} ${response.statusText}. Please check the console for details.`);
          }
        } catch (error) {
          console.warn('Failed to update license count:', error);
          alert('Failed to update license count. Please check the console for details.');
        }
      }

      // Mark this proposal as submitted
      setSubmittedProposals(prev => ({
        ...prev,
        [currentProposal]: true
      }));

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

  const handleFinalSubmit = async () => {
    console.log('🚀 handleFinalSubmit called');
    console.log('📄 Selected issue:', selectedIssue);
    console.log('📊 Current hasSubmittedFinalQuote before submission:', hasSubmittedFinalQuote);
    if (!selectedIssue) {
      alert("No issue selected");
      return;
    }

    setIsSubmittingQuote(true);

    try {
      const issueKey = selectedIssue.key;
      
      // Trigger final submission process
      console.log('📡 Sending final-submit request for issue:', issueKey);
      const response = await fetch(
        `http://localhost:8080/api/jira/contracts/final-submit/${issueKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log('📡 Final-submit response status:', response.status);

      if (!response.ok) {
        throw new Error("Failed to finalize submission");
      }

      // Set hasSubmittedFinalQuote to true immediately after successful submission
      console.log('🔧 Setting hasSubmittedFinalQuote to true in handleFinalSubmit');
      console.log('📊 hasSubmittedFinalQuote before setting:', hasSubmittedFinalQuote);
      setHasSubmittedFinalQuote(true);
      console.log('🔧 hasSubmittedFinalQuote set to true');
      console.log('📊 hasSubmittedFinalQuote after setting:', hasSubmittedFinalQuote);
      
      // Refresh issue details to get updated status
      await fetchIssueDetails(issueKey);
      
      // Try to fetch profit data after successful final submission
      try {
        console.log('📡 Fetching profit data for issue:', issueKey);
        const profitResponse = await fetch(
          `http://localhost:8080/api/jira/contracts/profit/${issueKey}`
        );
        console.log('📡 Profit data response status:', profitResponse.status);
        if (profitResponse.ok) {
          const profitData = await profitResponse.json();
          setTotalProfit(profitData.totalProfit);
          // Backend confirmation is not needed since we already set it to true above
        }
      } catch (profitError) {
        console.warn('Failed to fetch profit data after final submission:', profitError);
      }
      
      // Close the modal
      setIsUploadQuoteModalOpen(false);

      addNotification({
        title: "Final submission completed",
        message: `Final submission for ${issueKey} completed successfully.`,
        issueKey: issueKey,
      });
    } catch (error) {
      console.error("Error in final submission:", error);
      console.log('🔧 Error in final submission, not setting hasSubmittedFinalQuote to true');
      console.log('📊 hasSubmittedFinalQuote during error:', hasSubmittedFinalQuote);
      alert("Failed to complete final submission. Please try again.");
    } finally {
      console.log('🏁 handleFinalSubmit completed');
      console.log('📊 hasSubmittedFinalQuote at end of function:', hasSubmittedFinalQuote);
      setIsSubmittingQuote(false);
    }
  };

  const refreshOptimizedCostData = async () => {
    console.log('🔄🔄🔄 REFRESH OPTIMIZED COST DATA FUNCTION CALLED 🔄🔄🔄');
    console.log('🔄 refreshOptimizedCostData called for issue:', selectedIssue?.key);
    console.log('📊 Current state values:', { hasSubmittedFinalQuote, userRole, totalProfit });
    console.log('📍 Call stack trace:');
    console.trace('Function call trace');
    
    if (!selectedIssue?.key) {
      console.log('❌ No selected issue key, returning early');
      return;
    }
    
    // Log all available fields for debugging
    if (selectedIssue.fields) {
      const fieldKeys = Object.keys(selectedIssue.fields);
      console.log('📊 Available fields in selectedIssue:', selectedIssue.key, '-', fieldKeys.length, 'fields');
      console.log('🔍 Does customfield_10471 exist?', fieldKeys.includes('customfield_10471'));
      console.log('📋 Sample field keys:', fieldKeys.filter(key => key.startsWith('customfield_')).slice(0, 20));
      
      // Check for similar fields
      const similarFields = fieldKeys.filter(k => k.includes('104'));
      console.log('🔎 Fields with 104 in ID:', similarFields);
      
      if (fieldKeys.includes('customfield_10471')) {
        const fieldValue = selectedIssue.fields['customfield_10471'];
        console.log('💰 customfield_10471 value:', fieldValue);
        console.log('💰 customfield_10471 type:', typeof fieldValue);
        console.log('💰 customfield_10471 is null/undefined?:', fieldValue == null);
      } else {
        console.log('❓ Looking for customfield_10471 but not found');
      }
    } else {
      console.log('❌ No fields object in selectedIssue');
    }
    
    try {
      console.log('🚀 Attempting to fetch customfield_10471 for issue:', selectedIssue.key);
      // First, try to get the total optimized cost value directly from the custom field
      console.log('🔍 Trying to get customfield_10471 value via getFieldValue');
      const profitFieldValue = getFieldValue(["customfield_10471"]);
      console.log('📊 getFieldValue returned:', profitFieldValue);
      console.log('📊 getFieldValue truthy check:', !!profitFieldValue);
      
      if (profitFieldValue) {
        // Parse the total optimized cost value from the custom field
        const profitValue = parseFloat(profitFieldValue);
        console.log('📈 Parsed profit value:', profitValue);
        console.log('📈 isNaN check:', isNaN(profitValue));
        
        if (!isNaN(profitValue)) {
          setTotalProfit(profitValue);
          return;
        }
      }
      
      console.log('⚠️ Field value is empty or invalid, setting totalProfit to null');
      setTotalProfit(null);
      
      // If we can't get it from the custom field, try fetching from backend
      console.log('📡 Making backend call to fetch profit data for:', selectedIssue.key);
      const profitResponse = await fetch(
        `http://localhost:8080/api/jira/contracts/profit/${selectedIssue.key}`
      );
      console.log('📡 Backend response status:', profitResponse.status);
      
      if (profitResponse.ok) {
        const profitData = await profitResponse.json();
        console.log('📡 Backend profit data:', profitData);
        setTotalProfit(profitData.totalProfit);
        if (profitData.hasSubmittedFinalQuote) {
          console.log('🔧 Setting hasSubmittedFinalQuote to true from backend profitData');
          setHasSubmittedFinalQuote(true);
        }
      } else {
        console.warn('Failed to fetch profit data: Server returned', profitResponse.status, profitResponse.statusText);
        console.log('📡 Backend call failed, setting totalProfit to null');
        setTotalProfit(null);
        // Remove the alert message as requested
      }
    } catch (error) {
      console.warn('Failed to fetch profit data:', error);
      console.log('📡 Error occurred, setting totalProfit to null');
      setTotalProfit(null);
      // Remove the alert message as requested
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
              contractDuration: contractDurationVal || null,
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
  ): React.JSX.Element[] => {
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
                            // Use status name so each status gets its own Jira-like color
                            backgroundColor: getStatusColor(
                              selectedIssue?.fields?.status?.name ||
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
                                          // Prefer target status name for richer palette,
                                          // fall back to category color if needed
                                          backgroundColor: getStatusColor(
                                            transition.to?.name ||
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
                          onClick={() => {
                            console.log('📤 Upload Quote button clicked, hasSubmittedFinalQuote:', hasSubmittedFinalQuote);
                            setIsUploadQuoteModalOpen(true);
                          }}
                          disabled={hasSubmittedFinalQuote}
                          className={`inline-flex items-center px-3 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${hasSubmittedFinalQuote ? "bg-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
                        >
                          {(() => {
                            console.log('📤 Upload Quote button render check, hasSubmittedFinalQuote:', hasSubmittedFinalQuote);
                            return hasSubmittedFinalQuote ? "Quote Submitted" : "Upload Quote";
                          })()}
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

                        {/* Show optimized cost only after final quote submission */}
                        {userRole === "SUPER_ADMIN" && hasSubmittedFinalQuote && (
                          <div>
                            <div className="flex justify-between items-center">
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                Total Optimized Cost
                              </h4>
                              {totalProfit === null && (
                                <button 
                                  onClick={() => {
                                    console.log('🔁 Retry button clicked for Total Optimized Cost');
                                    refreshOptimizedCostData();
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="Refresh optimized cost data"
                                >
                                  Retry
                                </button>
                              )}
                            </div>
                            {totalProfit !== null ? (
                              <div className={`font-bold ${totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                ₹ {totalProfit.toLocaleString()}
                              </div>
                            ) : (
                              <div className="text-gray-500 dark:text-gray-400 text-sm">
                                Optimized cost data unavailable
                              </div>
                            )}
                          </div>
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

                    {/* Description
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
                    </div> */}

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
                              className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
                            >
                              {(attachment.mimeType ||
                                attachment.fileUrl
                              )?.startsWith("image/") ? (
                                <a 
                                  href={attachment.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={attachment.fileUrl}
                                    alt={
                                      attachment.fileName || attachment.filename
                                    }
                                    className="w-full h-32 object-cover hover:scale-105 transition-transform duration-200"
                                  />
                                </a>
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
                                  className="text-sm text-blue-600 hover:underline dark:text-blue-400 block"
                                >
                                  {attachment.fileName || attachment.filename}
                                </a>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {Math.round((attachment.fileSize || 0) / 1024)} KB
                                </div>
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

                  {/* Proposals Section */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 mt-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Proposals
                    </h2>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    {isLoadingProposals ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">Loading proposals...</p>
                      </div>
                    ) : proposals.length === 0 ? (
                      <div className="text-center py-6">
                        <svg
                          className="w-12 h-12 mx-auto text-gray-400"
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
                        <p className="mt-2 text-gray-500 dark:text-gray-400">No proposals yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          Upload your first proposal using the button above
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {proposals.map((p) => (
                          <div
                            key={p.id}
                            className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm"
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
                                <p className="text-gray-500 dark:text-gray-400">License Count</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {p.licenseCount}
                                </p>
                              </div>

                              <div>
                                <p className="text-gray-500 dark:text-gray-400">Unit Cost</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  ₹ {p.unitCost}
                                </p>
                              </div>

                              <div>
                                <p className="text-gray-500 dark:text-gray-400">Total Cost</p>
                                <p className="font-bold text-green-600 dark:text-green-400">
                                  ₹ {p.totalCost}
                                </p>
                              </div>

                              <div>
                                <p className="text-gray-500 dark:text-gray-400">Comment</p>
                                <p className="text-gray-900 dark:text-white">
                                  {p.comment || "-"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
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
                                  src={userData?.user?.avatar || "https://via.placeholder.com/48"}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100000] p-4">
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

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              {/* Show Submit button for final proposal */}
              {previewProposal?.final && !hasSubmittedFinalQuote && (
                <button
                  onClick={async () => {
                    // Call the final submit handler
                    await handleFinalSubmit();
                  }}
                  className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                >
                  Submit Quote
                </button>
              )}
              
              {/* Show "Quote Submitted" status for final proposal */}
              {previewProposal?.final && hasSubmittedFinalQuote && (
                <span className="px-4 py-2 rounded-md bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Quote Submitted
                </span>
              )}
              
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
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
                    onClick={() => !submittedProposals.first && setCurrentProposal("first")}
                    disabled={submittedProposals.first || hasSubmittedFinalQuote}
                    className={`p-3 rounded border text-center ${
                      currentProposal === "first"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    } ${(submittedProposals.first || hasSubmittedFinalQuote) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    First Proposal {submittedProposals.first && "✓"}
                  </button>
                  <button
                    type="button"
                    onClick={() => submittedProposals.first && !submittedProposals.second && setCurrentProposal("second")}
                    disabled={submittedProposals.second || !submittedProposals.first || hasSubmittedFinalQuote}
                    className={`p-3 rounded border text-center ${
                      currentProposal === "second"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    } ${(submittedProposals.second || !submittedProposals.first || hasSubmittedFinalQuote) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    Second Proposal {submittedProposals.second && "✓"}
                  </button>
                  <button
                    type="button"
                    onClick={() => submittedProposals.second && !submittedProposals.third && setCurrentProposal("third")}
                    disabled={submittedProposals.third || !submittedProposals.second || hasSubmittedFinalQuote}
                    className={`p-3 rounded border text-center ${
                      currentProposal === "third"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    } ${(submittedProposals.third || !submittedProposals.second || hasSubmittedFinalQuote) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    Third Proposal {submittedProposals.third && "✓"}
                  </button>
                  <button
                    type="button"
                    onClick={() => !submittedProposals.final && setCurrentProposal("final")}
                    disabled={submittedProposals.final}
                    className={`p-3 rounded border text-center ${
                      currentProposal === "final"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    } ${submittedProposals.final ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    Final Proposal {submittedProposals.final && "✓"}
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
                    // Find the last submitted non-final proposal based on user's path
                    // This represents the proposal the user was satisfied with before submitting final
                    let lastNonFinalProposal = null;
                    const sortedProposals = [...proposals]
                      .filter(p => !p.final)
                      .sort((a, b) => a.proposalNumber - b.proposalNumber);
                    
                    // Get the last non-final proposal (user's path)
                    if (sortedProposals.length > 0) {
                      lastNonFinalProposal = sortedProposals[sortedProposals.length - 1];
                    }

                    const lastTotalCost = lastNonFinalProposal 
                      ? Number(lastNonFinalProposal.totalCost || 0)
                      : 0;
                    const currentTotalCost = Number(totalCost || 0);
                    const profit = lastTotalCost - currentTotalCost;

                    return (
                      <div className="space-y-2">
                        {lastNonFinalProposal ? (
                          <>
                            <p className="text-sm text-gray-700 dark:text-gray-200">
                              {lastNonFinalProposal.proposalType} Proposal Total:{" "}
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
                          </>
                        ) : (
                          <p className="text-sm text-gray-700 dark:text-gray-200">
                            No previous proposal found for profit calculation
                          </p>
                        )}
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

                <label className="w-28 h-9 flex items-center justify-center border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                  Choose File
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setQuoteAttachments(Array.from(e.target.files));
                      }
                    }}
                  />
                </label>

                {/* Selected quote attachments preview list */}
                {quoteAttachments.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {quoteAttachments.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 text-xs font-semibold">
                            {file.name.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-gray-900 dark:text-gray-100">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {Math.round(file.size / 1024)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3 shrink-0">
                          {/* Eye icon to preview the file in a new tab */}
                          <button
                            type="button"
                            onClick={() => {
                              const url = URL.createObjectURL(file);
                              window.open(url, "_blank");
                              // Revoke after some time to avoid memory leaks
                              setTimeout(() => URL.revokeObjectURL(url), 30000);
                            }}
                            className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-blue-300 dark:hover:bg-blue-900 transition-colors"
                            title="Preview file"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>

                          {/* X button to remove file before submit */}
                          <button
                            type="button"
                            onClick={() => {
                              setQuoteAttachments((prev) =>
                                prev.filter((_, i) => i !== index)
                              );
                            }}
                            className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-300 dark:hover:bg-red-900 transition-colors"
                            title="Remove file"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
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

              {/* Show Final Submit button when final proposal is submitted */}
              {hasSubmittedFinalQuote ? (
                <button
                  onClick={handleFinalSubmit}
                  disabled={isSubmittingQuote}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmittingQuote ? "Processing..." : "Final Submit"}
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuote}
                  disabled={isSubmittingQuote || (currentProposal !== "final" && hasSubmittedFinalQuote)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmittingQuote ? "Saving..." : "Submit"}
                </button>
              )}
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
      
      {/* Attachment Preview Modal */}
      {showAttachmentPreview && previewAttachment && (
        <AttachmentPreview 
          file={new File(
            [],
            previewAttachment.fileName || previewAttachment.filename || "attachment",
            {
              type: previewAttachment.mimeType || "application/octet-stream",
            }
          )}
          fileUrl={previewAttachment.fileUrl || ""}
          hasLocalCopy={previewAttachment.hasLocalCopy}
          onClose={() => setShowAttachmentPreview(false)}
        />
      )}
    </>
  );
};

export default RequestSplitView;