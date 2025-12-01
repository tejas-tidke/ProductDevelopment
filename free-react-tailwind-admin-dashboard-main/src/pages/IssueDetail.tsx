  import React, { useState, useEffect } from "react";
  import { useParams, useNavigate, Link } from "react-router";
  import PageMeta from "../components/common/PageMeta";
  import { jiraService, IssueUpdateData, IssueTransition } from "../services/jiraService";
  import EditIssueModal from "../components/modals/EditIssueModal";
  import { usePermissions } from "../hooks/usePermissions";

  // Comment interface
  interface Comment {
    id: string;
    author: {
      displayName: string;
      avatarUrls: {
        "48x48": string;
      };
    };
    body: string;
    created: string;
    updated: string;
  }

  // History interface
  interface HistoryItem {
    id: string;
    author: {
      displayName: string;
      avatarUrls: {
        "48x48": string;
      };
    };
    field: string;
    oldValue: string;
    newValue: string;
    created: string;
  }

  // Worklog interface
  interface Worklog {
    id: string;
    author: {
      displayName: string;
      avatarUrls: {
        "48x48": string;
      };
    };
    updateAuthor: {
      displayName: string;
      avatarUrls: {
        "48x48": string;
      };
    };
    comment: string;
    created: string;
    updated: string;
    started: string;
    timeSpent: string;
    timeSpentSeconds: number;
  }

  // Define types for issue data
  interface Issue {
    id: string;
    key: string;
    fields: {
      summary?: string;
      project?: {
        name: string;
        key: string;
      };
      assignee?: {
        displayName: string;
        avatarUrls: {
          "48x48": string;
        };
      } | null;
      issuetype?: {
        name: string;
        iconUrl: string;
      };
      status?: {
        name: string;
        statusCategory: {
          colorName: string;
        };
      };
      priority?: {
        name: string;
        iconUrl: string;
      };
      resolution?: {
        name: string;
      };
      created?: string;
      updated?: string;
      reporter?: {
        displayName: string;
        avatarUrls: {
          "48x48": string;
        };
      };
      description?: string | null;
      customfield_10200?: string; // Assignee custom field
      customfield_10201?: string; // Reporter custom field
      // Additional Jira system fields
      labels?: string[];
      components?: Array<{ name: string }>;
      versions?: Array<{ name: string }>;
      fixVersions?: Array<{ name: string }>;
      environment?: string;
      duedate?: string;
      timetracking?: {
        originalEstimate?: string;
        remainingEstimate?: string;
        timeSpent?: string;
      };
      attachment?: Array<{
        id: string;
        filename: string;
        author: {
          displayName: string;
          avatarUrls: {
            "48x48": string;
          };
        };
        created: string;
        size: number;
        mimeType: string;
        content: string;
        thumbnail?: string;
      }>;
    };
    names?: Record<string, string>;
    changelog?: {
      histories: Array<{
        id: string;
        author: {
          displayName: string;
          avatarUrls: {
            "48x48": string;
          };
        };
        created: string;
        items: Array<{
          field: string;
          fieldtype: string;
          from: string;
          fromString: string;
          to: string;
          toString: string;
        }>;
      }>;
    };
  }

  // Simple Issue Type Icon Component
  const IssueTypeIcon: React.FC<{ type: string; size?: 'sm' | 'md' | 'lg' }> = ({ type, size = 'md' }) => {
    // Define icon sizes
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-8 h-8'
    };
    
    // Define colors and icons for different issue types (matching Jira's color scheme)
    const issueTypeConfig: Record<string, { color: string; bgColor: string; icon: string }> = {
      'Task': {
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z'
      },
      'Bug': {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 14h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z'
      },
      'Story': {
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-8 8z'
      },
      'Epic': {
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
      },
      'Sub-task': {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'
      },
      'Subtask': {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'
      },
      'default': {
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
      }
    };
    
    // Get configuration for the issue type or use default
    const config = issueTypeConfig[type] || issueTypeConfig['default'];
    
    return (
      <div className={`${config.bgColor} ${config.color} rounded-lg flex items-center justify-center ${sizeClasses[size]}`}>
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

  const IssueDetail: React.FC = () => {
    const { issueKey } = useParams<{ issueKey: string }>();
    const navigate = useNavigate();
    const { canEditIssue, userRole } = usePermissions();
    const [issue, setIssue] = useState<Issue | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'comments' | 'history' | 'transitions'>('comments');
    const [comments, setComments] = useState<Comment[]>([]);
    //for reply functionality 
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
const [replyText, setReplyText] = useState("");

    const [history, setHistory] = useState<HistoryItem[]>([]);
    // Remove unused state variables
    const [newComment, setNewComment] = useState('');
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [attachments, setAttachments] = useState<Issue['fields']['attachment']>([]);
    const [availableTransitions, setAvailableTransitions] = useState<IssueTransition[]>([]);
    
    // Add new state variables for dynamic status dropdown
    const [currentStatus, setCurrentStatus] = useState<string>("");
    
    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (isMoreDropdownOpen && !(event.target as Element).closest('.more-dropdown')) {
          setIsMoreDropdownOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isMoreDropdownOpen]);

    // Handle delete issue
    const handleDeleteIssue = async () => {
      if (window.confirm(`Are you sure you want to delete issue ${issueKey}?`)) {
        try {
          await jiraService.deleteIssue(issueKey!);
          // Navigate back to the issues list
          if (issue?.fields.project?.key) {
            navigate(`/project/${issue.fields.project.key}`);
          } else {
            navigate('/issues');
          }
        } catch (err) {
          console.error("Error deleting issue:", err);
          alert("Failed to delete issue. Please try again later.");
        }
      }
      setIsMoreDropdownOpen(false);
    };

    // Handle edit issue
    const handleEditIssue = () => {
      setIsEditModalOpen(true);
      setIsMoreDropdownOpen(false);
    };

    // Handle edit issue submission
    const handleEditIssueSubmit = async (issueIdOrKey: string, issueData: IssueUpdateData) => {
      try {
        await jiraService.updateIssue(issueIdOrKey, issueData);
        // Refresh the issue data
        const updatedIssue = await jiraService.getIssueByIdOrKey(issueIdOrKey);
        setIssue(updatedIssue);
        alert('Issue updated successfully');
      } catch (error) {
        console.error('Error updating issue:', error);
        alert('Failed to update issue');
      }
    };

    // Handle status change
    const handleStatusChange = async (transitionId: string, newStatusName: string) => {
      try {
        console.log(`Attempting to transition issue ${issueKey} with transition ID: ${transitionId} to status: ${newStatusName}`);
        // Call the API to transition the issue
        const transitionResponse = await jiraService.transitionIssue(issueKey!, transitionId);
        console.log("Transition response:", transitionResponse);
        setCurrentStatus(newStatusName);
        console.log(`Successfully transitioned issue to: ${newStatusName}`);
        
        // Refresh the issue data to get the updated status
        const updatedIssue = await jiraService.getIssueByIdOrKey(issueKey!);
        setIssue(updatedIssue);
        console.log("Updated issue data:", updatedIssue);
        
        // Refresh the available transitions
        const transitionsResponse = await jiraService.getIssueTransitions(issueKey!);
        console.log("Refreshed transitions response:", transitionsResponse);
        // Check if transitionsResponse has a 'transitions' property and it's an array
        if (transitionsResponse && 
            typeof transitionsResponse === 'object' && 
            'transitions' in transitionsResponse && 
            Array.isArray(transitionsResponse.transitions)) {
          setAvailableTransitions(transitionsResponse.transitions);
          console.log("Refreshed available transitions:", transitionsResponse.transitions);
        }
        
        alert(`Issue status changed to: ${newStatusName}`);
      } catch (error) {
        console.error("Error changing issue status:", error);
        alert("Failed to change issue status. Please try again later.");
      }
    };

    // Check if a transition is allowed based on user role and current status
    const isTransitionAllowed = (userRole: string | null, currentStatus: string, targetStatus: string): boolean => {
      // REQUESTER cannot transition anything
      if (userRole === 'REQUESTER') {
        return false;
      }

      // APPROVER can only transition from "Request Created" to "Pre-Approval" or "Declined"
      if (userRole === 'APPROVER') {
        if (currentStatus === 'Request Created' && (targetStatus === 'Pre-Approval' || targetStatus === 'Declined')) {
          return true;
        }
        // Cannot transition from any other status
        return false;
      }

      // ADMIN can transition from "Pre-Approval" to "Request Review" and from "Request Review" to "Approved" or "Declined"
      if (userRole === 'ADMIN') {
        if (currentStatus === 'Pre-Approval' && targetStatus === 'Request Review') {
          return true;
        }
        if (currentStatus === 'Request Review' && (targetStatus === 'Approved' || targetStatus === 'Declined')) {
          return true;
        }
        return false;
      }

      // SUPER_ADMIN can transition everything
      if (userRole === 'SUPER_ADMIN') {
        return true;
      }

      // Default: no transitions allowed
      return false;
    };

    // Handle add comment
    const handleAddComment = () => {
      if (newComment.trim()) {
        const comment: Comment = {
          id: Date.now().toString(),
          author: {
            displayName: 'Current User', // In a real app, this would be the logged-in user
            avatarUrls: { '48x48': 'https://via.placeholder.com/48' }
          },
          body: newComment,
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        };
        setComments(prev => [comment, ...prev]);
        setNewComment('');
        setIsAddingComment(false);
      }
    };
    // function for  reply functionality
    const submitReply = async (parentId: string) => {
  if (!replyText.trim()) return;

  try {
    await commentService.addComment(issueKey, replyText, parentId);

    setReplyText("");
    setReplyingTo(null);

    // Re-load comments so the reply appears
    fetchComments();
  } catch (error) {
    console.error("Error adding reply:", error);
  }
};


    // Fetch issue data
    useEffect(() => {
      const fetchIssue = async () => {
        try {
          setLoading(true);
          setError(null);
          console.log("Fetching issue data for:", issueKey);
          
          // Fetch the specific issue with all details
          const issueResponse = await jiraService.getIssueByIdOrKey(issueKey!);
          console.log("Full issue response:", JSON.stringify(issueResponse, null, 2));
          console.log("Issue fields:", issueResponse.fields);
          console.log("Attachment field in issue:", issueResponse.fields?.attachment);
          setIssue(issueResponse);
          setCurrentStatus(issueResponse.fields?.status?.name || '');
          console.log("Current status set to:", issueResponse.fields?.status?.name);
          
          // Fetch available transitions for the issue
          try {
            console.log("Fetching transitions for issue:", issueKey);
            const transitionsResponse = await jiraService.getIssueTransitions(issueKey!);
            console.log("Raw transitions response:", transitionsResponse);
            console.log("Type of transitions response:", typeof transitionsResponse);
            // Log transitions count safely
            if (Array.isArray(transitionsResponse)) {
              console.log("Available transitions count:", transitionsResponse.length);
            } else if (transitionsResponse && typeof transitionsResponse === 'object') {
              // Try to safely access transitions property
              const obj = transitionsResponse as Record<string, unknown>;
              if ('transitions' in obj && Array.isArray(obj.transitions)) {
                console.log("Available transitions count:", obj.transitions.length);
              } else {
                console.log("Available transitions count: 0 (object without transitions array)");
              }
            } else {
              console.log("Available transitions count: 0 (invalid response)");
            }
            
            // Check if transitionsResponse has a 'transitions' property and it's an array
            if (transitionsResponse && 
                typeof transitionsResponse === 'object' && 
                'transitions' in transitionsResponse && 
                Array.isArray(transitionsResponse.transitions)) {
              setAvailableTransitions(transitionsResponse.transitions);
              console.log("Available transitions set:", transitionsResponse.transitions);
              // Log each transition for debugging
              transitionsResponse.transitions.forEach((transition, index) => {
                console.log(`Transition ${index}: ID=${transition.id}, Name=${transition.name}, To=${transition.to.name}`);
              });
            } else {
              console.warn("Invalid transitions response format:", transitionsResponse);
              console.log("Checking if response is directly an array...");
              // Check if the response itself is an array of transitions (different format)
              if (Array.isArray(transitionsResponse)) {
                console.log("Transitions response is directly an array, setting as transitions");
                setAvailableTransitions(transitionsResponse);
                console.log("Available transitions set from array:", transitionsResponse);
                transitionsResponse.forEach((transition, index) => {
                  console.log(`Transition ${index}: ID=${transition.id}, Name=${transition.name}, To=${transition.to.name}`);
                });
              } else {
                // Try to find transitions in different possible locations
                let foundTransitions = null;
                
                // Check if it's in a 'data' property
                if (transitionsResponse && 
                    typeof transitionsResponse === 'object') {
                  const typedResponse = transitionsResponse as Record<string, unknown>;
                  if ('data' in typedResponse &&
                      typedResponse.data !== null &&
                      typeof typedResponse.data === 'object') {
                    const dataObj = typedResponse.data as Record<string, unknown>;
                    if ('transitions' in dataObj && Array.isArray(dataObj.transitions)) {
                      foundTransitions = dataObj.transitions;
                    }
                  }
                }
                
                // Check if it's directly in the response object (no 'transitions' wrapper)
                if (!foundTransitions && 
                    transitionsResponse && 
                    typeof transitionsResponse === 'object') {
                  // Look for properties that might contain transitions
                  const responseObj = transitionsResponse as Record<string, unknown>;
                  for (const key in responseObj) {
                    if (Array.isArray(responseObj[key])) {
                      // Check if this array contains transition-like objects
                      const array = responseObj[key] as unknown[];
                      if (array.length > 0 && 
                          typeof array[0] === 'object' && 
                          array[0] !== null &&
                          'id' in array[0] &&
                          'name' in array[0]) {
                        console.log(`Found transitions in property '${key}'`);
                        foundTransitions = array as IssueTransition[];
                        break;
                      }
                    }
                  }
                }
                
                if (foundTransitions) {
                  setAvailableTransitions(foundTransitions);
                  console.log("Found transitions:", foundTransitions);
                  foundTransitions.forEach((transition, index) => {
                    console.log(`Transition ${index}: ID=${transition.id}, Name=${transition.name}, To=${transition.to.name}`);
                  });
                } else {
                  console.log("No transitions found in response, setting empty array");
                  setAvailableTransitions([]);
                }
              }
            }
            // Log the final state after setting transitions
            setTimeout(() => {
              console.log("Final available transitions count:", availableTransitions.length);
            }, 0);
          } catch (err) {
            console.warn("Failed to fetch transitions:", err);
            setAvailableTransitions([]);
          }
          
          // Extract attachments from the issue response
          if (issueResponse.fields && issueResponse.fields.attachment) {
            console.log("Attachments found in issue response:", issueResponse.fields.attachment);
            setAttachments(issueResponse.fields.attachment);
          } else {
            console.log("No attachments in issue response, fetching separately");
            console.log("Issue response keys:", Object.keys(issueResponse));
            console.log("Issue fields keys:", issueResponse.fields ? Object.keys(issueResponse.fields) : 'No fields');
            // Fetch attachments separately if not in the main response
            try {
              const attachmentsResponse = await jiraService.getIssueAttachments(issueKey!);
              console.log("Attachments response from separate call:", JSON.stringify(attachmentsResponse, null, 2));
              // Check if attachmentsResponse is an array
              if (Array.isArray(attachmentsResponse)) {
                console.log("Setting attachments from separate call:", attachmentsResponse);
                setAttachments(attachmentsResponse);
              } else {
                console.log("Attachments response is not an array, setting empty array");
                setAttachments([]);
              }
            } catch (err) {
              console.warn("Failed to fetch attachments:", err);
              setAttachments([]);
            }
          }
          
          // Fetch comments
          let commentsData: Comment[] = [];
          try {
            const commentsResponse = await jiraService.getIssueComments(issueKey!);
            console.log("Comments response:", commentsResponse);
            // Check if commentsResponse has a 'comments' property or is directly the comments array
            if (commentsResponse && typeof commentsResponse === 'object' && 'comments' in commentsResponse) {
              commentsData = Array.isArray(commentsResponse.comments) ? commentsResponse.comments : [];
            } else if (Array.isArray(commentsResponse)) {
              commentsData = commentsResponse;
            } else {
              commentsData = [];
            }
            console.log("Processed comments data:", commentsData);
            setComments(commentsData);
          } catch (err) {
            console.warn("Failed to fetch comments:", err);
            setComments([]);
          }
          
          // Process changelog to create history items
          const historyItems: HistoryItem[] = [];
          if (issueResponse.changelog && issueResponse.changelog.histories) {
            console.log("Changelog data:", issueResponse.changelog);
            issueResponse.changelog.histories.forEach((history: { 
              id: string; 
              author: { 
                displayName: string; 
                avatarUrls: { "48x48": string; }; 
              }; 
              created: string; 
              items: Array<{ 
                field: string; 
                fromString: string; 
                toString: string; 
              }>; 
            }) => {
              history.items.forEach((item: { 
                field: string; 
                fromString: string; 
                toString: string; 
              }) => {
                historyItems.push({
                  id: `${history.id}-${item.field}`,
                  author: history.author,
                  field: item.field,
                  oldValue: item.fromString || '',
                  newValue: item.toString || '',
                  created: history.created
                });
              });
            });
            console.log("Processed history items:", historyItems);
            setHistory(historyItems);
          } else {
            console.log("No changelog data found");
            setHistory([]);
          }
          
          // Fetch worklogs
          let worklogsData: Worklog[] = [];
          try {
            const worklogsResponse = await jiraService.getIssueWorklogs(issueKey!);
            console.log("Worklogs response:", worklogsResponse);
            // Check if worklogsResponse has a 'worklogs' property or is directly the worklogs array
            if (worklogsResponse && typeof worklogsResponse === 'object' && 'worklogs' in worklogsResponse) {
              worklogsData = Array.isArray(worklogsResponse.worklogs) ? worklogsResponse.worklogs : [];
            } else if (Array.isArray(worklogsResponse)) {
              worklogsData = worklogsResponse;
            } else {
              worklogsData = [];
            }
            console.log("Processed worklogs data:", worklogsData);
          } catch (err) {
            console.warn("Failed to fetch worklogs:", err);
          }
        } catch (err) {
          console.error("Error fetching issue:", err);
          setError("Failed to fetch issue details. Please try again later.");
        } finally {
          setLoading(false);
        }
      };

      if (issueKey) {
        fetchIssue();
      }
    }, [issueKey]);

    // Format date for display
    const formatDate = (dateString?: string) => {
      if (!dateString) return 'Unknown';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Get status color based on status category or name
    if (loading) {
      return (
        <>
          <PageMeta title="Issue Details" description="View issue details" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            </div>
          </div>
        </>
      );
    }

    if (error) {
      return (
        <>
          <PageMeta title="Issue Details" description="View issue details" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error! </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            </div>
          </div>
        </>
      );
    }

    if (!issue) {
      return (
        <>
          <PageMeta title="Issue Details" description="View issue details" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-center py-12">
                <h2 className="text-xl font-medium text-gray-900 dark:text-white">Issue not found</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">The requested issue could not be found.</p>
                <div className="mt-6">
                  <Link 
                    to="/issues" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back to Issues
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <PageMeta title={`Issue ${issue.key}`} description={issue.fields.summary || "Issue details"} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Edit Issue Modal */}
          {issue && (
            <EditIssueModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSubmit={handleEditIssueSubmit}
              issue={
                {
                  id: issue.id,
                  key: issue.key,
                  fields: {
                    summary: issue.fields.summary,
                    project: issue.fields.project ? { key: issue.fields.project.key } : undefined,
                    description: issue.fields.description ? 
                      (typeof issue.fields.description === 'object' 
                        ? JSON.stringify(issue.fields.description) 
                        : issue.fields.description) : 
                      undefined,
                    duedate: issue.fields.duedate,
                    issuetype: issue.fields.issuetype ? { name: issue.fields.issuetype.name } : undefined,
                    customfield_10200: issue.fields.customfield_10200
                  }
                }
              }
            />
          )}
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {/* Issue Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3">
                    <IssueTypeIcon type={issue.fields.issuetype?.name || 'default'} size="md" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      {issue.key}: {issue.fields.summary}
                    </h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {issue.fields.issuetype?.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {issue.fields.priority?.name}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Status Dropdown */}
                {canEditIssue() && (
                  <div className="ml-4">
                    <select
                      value={currentStatus}
                      onChange={async (e) => {
                        const selectedTransition = availableTransitions.find(
                          (t) => t.to.name === e.target.value
                        );
                        if (selectedTransition) {
                          // Check if transition is allowed
                          if (isTransitionAllowed(userRole, currentStatus, selectedTransition.to.name)) {
                            await jiraService.transitionIssue(issueKey!, selectedTransition.id);
                            setCurrentStatus(e.target.value);
                            alert(`Status updated to ${e.target.value}`);
                          } else {
                            alert(`You are not allowed to transition to ${e.target.value}`);
                          }
                        }
                      }}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                      aria-label="Change issue status"
                    >
                      <option value={currentStatus} disabled>
                        {currentStatus}
                      </option>
                      {availableTransitions.map((t) => {
                        const allowed = isTransitionAllowed(userRole, currentStatus, t.to.name);
                        return (
                          <option 
                            key={t.id} 
                            value={t.to.name}
                            disabled={!allowed}
                            style={{ opacity: allowed ? 1 : 0.5 }}
                          >
                            {t.to.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                
                <div className="mt-4 md:mt-0 relative more-dropdown">
                  <button
                    onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
                  >
                    More
                    <svg className="ml-2 -mr-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {isMoreDropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-1" role="menu">
                        {canEditIssue() && (
                          <button
                            onClick={handleEditIssue}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                            role="menuitem"
                          >
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                              Edit
                            </div>
                          </button>
                        )}
                        {canEditIssue() && (
                          <button
                            onClick={handleDeleteIssue}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-600"
                            role="menuitem"
                          >
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                              Delete
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Issue Content */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Panel - 20% width (Details Sidebar) */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Details</h3>
                    
                    <div className="space-y-4">
                      {/* Description */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Description</h4>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {issue.fields.description ? (
                            typeof issue.fields.description === 'object' 
                              ? JSON.stringify(issue.fields.description)
                              : issue.fields.description
                          ) : "No description provided"}
                        </div>
                      </div>
                      
                      {/* Issue Type */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Issue Type</h4>
                        <div className="flex items-center">
                          <div className="mr-2">
                            <IssueTypeIcon type={issue.fields.issuetype?.name || 'default'} size="sm" />
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {issue.fields.issuetype?.name || "Unknown"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Project */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Project</h4>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {issue.fields.project?.name || "Unknown"}
                        </div>
                      </div>
                      
                      {/* Priority */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Priority</h4>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {issue.fields.priority?.name || "Unknown"}
                        </div>
                      </div>
                      
                      {/* Assignee */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Assignee</h4>
                        <div className="flex items-center">
                          {issue.fields.assignee ? (
                            <>
                              <img 
                                className="h-6 w-6 rounded-full" 
                                src={issue.fields.assignee.avatarUrls["48x48"]} 
                                alt={issue.fields.assignee.displayName} 
                              />
                              <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                {issue.fields.assignee.displayName}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-900 dark:text-white">Unassigned</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Reporter */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Reporter</h4>
                        <div className="flex items-center">
                          {issue.fields.reporter ? (
                            <>
                              <img 
                                className="h-6 w-6 rounded-full" 
                                src={issue.fields.reporter.avatarUrls["48x48"]} 
                                alt={issue.fields.reporter.displayName} 
                              />
                              <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                {issue.fields.reporter.displayName}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-900 dark:text-white">Unknown</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Custom Fields */}
                      {issue.fields.customfield_10200 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Assignee (Custom)</h4>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {issue.fields.customfield_10200}
                          </div>
                        </div>
                      )}
                      
                      {issue.fields.customfield_10201 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Reporter (Custom)</h4>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {issue.fields.customfield_10201}
                          </div>
                        </div>
                      )}
                      
                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Created */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Created</h4>
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span className="text-sm text-gray-900 dark:text-white">{formatDate(issue.fields.created)}</span>
                          </div>
                        </div>

                        {/* Updated */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Updated</h4>
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                            <span className="text-sm text-gray-900 dark:text-white">{formatDate(issue.fields.updated)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Attachments */}
                      <div>
                        {(attachments && attachments.length > 0) && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Attachments</h4>
                            <div className="space-y-2">
                              {attachments.map((attachment) => (
                                <div key={attachment.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500">
                                  <div className="flex items-center">
                                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                                    </svg>
                                    <div>
                                      <a 
                                        href={`/api/jira/attachment/content/${attachment.id}`}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                      >
                                        {attachment.filename}
                                      </a>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {Math.round(attachment.size / 1024)} KB
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(attachment.created)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Main Content - 80% width (Issue Details) */}
                <div className="lg:col-span-4">
                  {/* Tabs */}
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setActiveTab('all')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'all'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setActiveTab('comments')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'comments'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        Comments
                      </button>
                      <button
                        onClick={() => setActiveTab('history')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'history'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        History
                      </button>
                      <button
                        onClick={() => setActiveTab('transitions')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === 'transitions'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        Transitions
                      </button>
                    </nav>
                  </div>
                  
                  {/* Tab Content */}
                  <div className="mt-6">
                    {/* All Tab */}
                    {activeTab === 'all' && (
                      <div className="space-y-6">
                        {/* Comments Section */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Comments</h3>
                          <div className="space-y-4">
                            {comments.length > 0 ? (
                              comments.map((comment) => (
                                <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                  <div className="flex items-start">
                                    <img 
                                      className="h-8 w-8 rounded-full" 
                                      src={comment.author.avatarUrls["48x48"]} 
                                      alt={comment.author.displayName} 
                                    />
                                    <div className="ml-3 flex-1">
                                      <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                          {comment.author.displayName}
                                        </h4>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {formatDate(comment.created)}
                                        </span>
                                      </div>
                                      <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                        {comment.body ? (
                                          typeof comment.body === 'object' 
                                            ? JSON.stringify(comment.body)
                                            : comment.body

                                        ) : ""}
                                      </div>
                                      <button
  onClick={() => setReplyingTo(comment.id)}
  className="text-blue-600 text-sm mt-2 hover:underline"
>
  Reply
</button>
{replyingTo === comment.id && (
  <div className="mt-3 ml-8">
    <textarea
      className="w-full border rounded p-2 text-sm"
      placeholder="Write a reply..."
      value={replyText}
      onChange={(e) => setReplyText(e.target.value)}
    />
    <button
      onClick={() => submitReply(comment.id)}
      className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm"
    >
      Submit Reply
    </button>
  </div>
)}

                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500 dark:text-gray-400">No comments yet.</p>
                            )}
                          </div>
                        </div>
                        
                        {/* History Section */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">History</h3>
                          <div className="space-y-4">
                            {history.length > 0 ? (
                              history.map((item) => (
                                <div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                        <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                      </div>
                                    </div>
                                    <div className="ml-3 flex-1">
                                      <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                          {item.author.displayName}
                                        </h4>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {formatDate(item.created)}
                                        </span>
                                      </div>
                                      <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                        Changed <span className="font-medium">{item.field}</span> from 
                                        <span className="mx-1 line-through">{item.oldValue || 'empty'}</span> to 
                                        <span className="ml-1 font-medium">{item.newValue || 'empty'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500 dark:text-gray-400">No history yet.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Comments Tab */}
                    {activeTab === 'comments' && (
                      <div className="space-y-6">
                        {isAddingComment ? (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment..."
                              rows={3}
                              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="mt-3 flex justify-end space-x-3">
                              <button
                                onClick={() => setIsAddingComment(false)}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleAddComment}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none"
                              >
                                Add Comment
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsAddingComment(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                          >
                            <svg className="mr-2 -ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            Add Comment
                          </button>
                        )}
                        
                        <div className="space-y-4">
                          {comments.length > 0 ? (
                            comments.map((comment) => (
                              <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <div className="flex items-start">
                                  <img 
                                    className="h-8 w-8 rounded-full" 
                                    src={comment.author.avatarUrls["48x48"]} 
                                    alt={comment.author.displayName} 
                                  />
                                  <div className="ml-3 flex-1">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                        {comment.author.displayName}
                                      </h4>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDate(comment.created)}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                      {comment.body ? (
                                        typeof comment.body === 'object' 
                                          ? JSON.stringify(comment.body)
                                          : comment.body
                                      ) : ""}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 dark:text-gray-400">No comments yet.</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* History Tab */}
                    {activeTab === 'history' && (
                      <div className="space-y-4">
                        {history.length > 0 ? (
                          history.map((item) => (
                            <div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                              <div className="flex items-start">
                                <div className="flex-shrink-0">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                  </div>
                                </div>
                                <div className="ml-3 flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                      {item.author.displayName}
                                    </h4>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatDate(item.created)}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                    Changed <span className="font-medium">{item.field}</span> from 
                                    <span className="mx-1 line-through">{item.oldValue || 'empty'}</span> to 
                                    <span className="ml-1 font-medium">{item.newValue || 'empty'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400">No history yet.</p>
                        )}
                      </div>
                    )}
                    
                    {/* Transitions Tab */}
                    {activeTab === 'transitions' && canEditIssue() && (
                      <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Change Status</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Available transitions count: {availableTransitions.length}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {availableTransitions.length > 0 ? (
                              <>
                                {availableTransitions.map((transition) => {
                                  const allowed = isTransitionAllowed(userRole, currentStatus, transition.to.name);
                                  return (
                                    <button
                                      key={transition.id}
                                      onClick={() => handleStatusChange(transition.id, transition.to.name)}
                                      className={`px-3 py-1.5 text-sm rounded-md ${
                                        currentStatus === transition.to.name
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                                          : 'bg-white text-gray-700 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500'
                                      }`}
                                      disabled={!allowed}
                                      style={{ opacity: allowed ? 1 : 0.5, cursor: allowed ? 'pointer' : 'not-allowed' }}
                                    >
                                      {transition.name}
                                    </button>
                                  );
                                })}
                              </>
                            ) : (
                              <p className="text-gray-500 dark:text-gray-400">No transitions available.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  export default IssueDetail;