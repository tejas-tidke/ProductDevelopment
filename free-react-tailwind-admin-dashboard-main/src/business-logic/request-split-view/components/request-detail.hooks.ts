// Custom hooks for request detail view

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import {
  fetchIssueByKey,
  fetchComments,
  addComment,
  fetchAttachments,
  fetchContractProposals,
  submitContractProposal,
  updateIssue,
  transitionIssue
} from "./request-detail.service";
import { 
  DetailIssue, 
  DetailComment, 
  DetailAttachment, 
  DetailContractProposalDto 
} from "./request-detail.types";

/**
 * Hook for managing request detail state and data fetching
 */
export const useRequestDetailData = (addNotification: (message: string, type: "success" | "error" | "warning" | "info") => void) => {
  const { issueKey } = useParams<{ issueKey: string }>();

  // State
  const [issues, setIssues] = useState<DetailIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<DetailIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [selectedIssueType, setSelectedIssueType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Dropdown data
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>([]);
  const [issueTypes, setIssueTypes] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<{ id: string; name: string }[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);

  // Comments
  const [comments, setComments] = useState<DetailComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Attachments and proposals
  const [attachments, setAttachments] = useState<DetailAttachment[]>([]);
  const [proposals, setProposals] = useState<DetailContractProposalDto[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);

  // Proposal form state
  const [currentProposal, setCurrentProposal] = useState<"first" | "second" | "third" | "final">("first");
  const [submittedProposals, setSubmittedProposals] = useState<Record<string, boolean>>({
    first: false,
    second: false,
    third: false,
    final: false
  });
  const [hasSubmittedFinalQuote, setHasSubmittedFinalQuote] = useState(false);
  const [unitCost, setUnitCost] = useState("");
  const [editableLicenseCount, setEditableLicenseCount] = useState("0");
  const [proposalComment, setProposalComment] = useState("");
  const [quoteAttachments, setQuoteAttachments] = useState<File[]>([]);

  // UI state
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [previewProposal, setPreviewProposal] = useState<DetailContractProposalDto | null>(null);

  /**
   * Load issue data with retry logic
   */
  const loadIssue = useCallback(async (retryCount = 0) => {
    if (!issueKey) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching issue ${issueKey} (attempt ${retryCount + 1})`);
      const startTime = Date.now();
      const issue = await fetchIssueByKey(issueKey);
      const endTime = Date.now();
      console.log(`Successfully fetched issue ${issueKey} in ${endTime - startTime}ms`);
      setSelectedIssue(issue);
    } catch (err: any) {
      console.error("Error loading issue:", err);
      
      // Retry logic for timeout errors and resource exhaustion (up to 2 retries)
      if ((err.message.includes('timeout') || err.message.includes('INSUFFICIENT_RESOURCES')) && retryCount < 2) {
        console.log(`Retrying issue load (${retryCount + 1}/2)...`);
        setTimeout(() => loadIssue(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      const errorMessage = err.message.includes('timeout') 
        ? `Request timeout: Server took too long to respond. Please try again. (Attempt ${retryCount + 1})` 
        : err.message.includes('INSUFFICIENT_RESOURCES')
        ? "Browser resource limit reached. Please close other tabs and try again."
        : `Failed to load issue data. Please try again. (Attempt ${retryCount + 1})`;
      setError(errorMessage);
      addNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [issueKey, addNotification]);

  /**
   * Load comments for the issue with retry logic
   */
  const loadComments = useCallback(async (retryCount = 0) => {
    if (!issueKey) return;
    
    try {
      console.log(`Fetching comments for ${issueKey} (attempt ${retryCount + 1})`);
      const startTime = Date.now();
      const issueComments = await fetchComments(issueKey);
      const endTime = Date.now();
      console.log(`Successfully fetched comments for ${issueKey} in ${endTime - startTime}ms`);
      setComments(issueComments);
    } catch (err: any) {
      console.error("Error loading comments:", err);
      
      // Retry logic for timeout errors and resource exhaustion (up to 2 retries)
      if ((err.message.includes('timeout') || err.message.includes('INSUFFICIENT_RESOURCES')) && retryCount < 2) {
        console.log(`Retrying comments load (${retryCount + 1}/2)...`);
        setTimeout(() => loadComments(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      const errorMessage = err.message.includes('timeout') 
        ? `Request timeout: Server took too long to load comments. Please try again. (Attempt ${retryCount + 1})` 
        : err.message.includes('INSUFFICIENT_RESOURCES')
        ? "Browser resource limit reached. Please close other tabs and try again."
        : `Failed to load comments. Please try again. (Attempt ${retryCount + 1})`;
      addNotification(errorMessage, "error");
    }
  }, [issueKey, addNotification]);

  /**
   * Load attachments for the issue with retry logic
   */
  const loadAttachments = useCallback(async (retryCount = 0) => {
    if (!issueKey) return;
    
    try {
      console.log(`Fetching attachments for ${issueKey} (attempt ${retryCount + 1})`);
      const startTime = Date.now();
      const issueAttachments = await fetchAttachments(issueKey);
      const endTime = Date.now();
      console.log(`Successfully fetched attachments for ${issueKey} in ${endTime - startTime}ms`);
      setAttachments(issueAttachments);
    } catch (err: any) {
      console.error("Error loading attachments:", err);
      
      // Retry logic for timeout errors and resource exhaustion (up to 2 retries)
      if ((err.message.includes('timeout') || err.message.includes('INSUFFICIENT_RESOURCES')) && retryCount < 2) {
        console.log(`Retrying attachments load (${retryCount + 1}/2)...`);
        setTimeout(() => loadAttachments(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      const errorMessage = err.message.includes('timeout') 
        ? `Request timeout: Server took too long to load attachments. Please try again. (Attempt ${retryCount + 1})` 
        : err.message.includes('INSUFFICIENT_RESOURCES')
        ? "Browser resource limit reached. Please close other tabs and try again."
        : `Failed to load attachments. Please try again. (Attempt ${retryCount + 1})`;
      addNotification(errorMessage, "error");
    }
  }, [issueKey, addNotification]);

  /**
   * Load contract proposals for the issue with retry logic
   */
  const loadProposals = useCallback(async (issueKeyParam?: string, retryCount = 0) => {
    const keyToUse = issueKeyParam || issueKey;
    if (!keyToUse) return;
    
    try {
      setIsLoadingProposals(true);
      console.log(`Fetching proposals for ${keyToUse} (attempt ${retryCount + 1})`);
      const startTime = Date.now();
      const issueProposals = await fetchContractProposals(keyToUse);
      const endTime = Date.now();
      console.log(`Successfully fetched proposals for ${keyToUse} in ${endTime - startTime}ms`);
      setProposals(issueProposals);
    } catch (err: any) {
      console.error("Error loading proposals:", err);
      
      // Retry logic for timeout errors and resource exhaustion (up to 2 retries)
      if ((err.message.includes('timeout') || err.message.includes('INSUFFICIENT_RESOURCES')) && retryCount < 2) {
        console.log(`Retrying proposals load (${retryCount + 1}/2)...`);
        setTimeout(() => loadProposals(issueKeyParam, retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      const errorMessage = err.message.includes('timeout') 
        ? `Request timeout: Server took too long to load proposals. Please try again. (Attempt ${retryCount + 1})` 
        : err.message.includes('INSUFFICIENT_RESOURCES')
        ? "Browser resource limit reached. Please close other tabs and try again."
        : `Failed to load proposals. Please try again. (Attempt ${retryCount + 1})`;
      addNotification(errorMessage, "error");
    } finally {
      setIsLoadingProposals(false);
    }
  }, [issueKey, addNotification]);

  /**
   * Add a new comment
   */
  const handleAddComment = useCallback(async () => {
    if (!issueKey || !newComment.trim()) return;
    
    try {
      setIsAddingComment(true);
      const comment = await addComment(issueKey, newComment, replyingToCommentId || undefined);
      
      // Update comments list
      setComments(prev => [...prev, comment]);
      setNewComment("");
      setReplyingToCommentId(null);
      setReplyText("");
      
      addNotification("Comment added successfully", "success");
    } catch (err) {
      console.error("Error adding comment:", err);
      addNotification("Failed to add comment", "error");
    } finally {
      setIsAddingComment(false);
    }
  }, [issueKey, newComment, replyingToCommentId, addNotification]);

  /**
   * Submit a contract proposal
   */
  const handleSubmitProposal = useCallback(async (
    proposalData: Omit<DetailContractProposalDto, "id" | "jiraIssueKey" | "createdAt">
  ) => {
    if (!issueKey) return;
    
    try {
      setIsSubmittingQuote(true);
      const proposal = await submitContractProposal(issueKey, proposalData);
      
      // Update proposals list
      setProposals(prev => [...prev, proposal]);
      
      // Update submission state
      setSubmittedProposals(prev => ({
        ...prev,
        [proposalData.proposalType]: true
      }));
      
      if (proposalData.final) {
        setHasSubmittedFinalQuote(true);
      }
      
      addNotification("Proposal submitted successfully", "success");
      return proposal;
    } catch (err) {
      console.error("Error submitting proposal:", err);
      addNotification("Failed to submit proposal", "error");
      throw err;
    } finally {
      setIsSubmittingQuote(false);
    }
  }, [issueKey, addNotification]);

  /**
   * Update an issue
   */
  const handleUpdateIssue = useCallback(async (
    issueIdOrKey: string,
    issueData: any
  ) => {
    try {
      const updatedIssue = await updateIssue(issueIdOrKey, issueData);
      setSelectedIssue(updatedIssue);
      addNotification("Issue updated successfully", "success");
      return updatedIssue;
    } catch (err) {
      console.error("Error updating issue:", err);
      addNotification("Failed to update issue", "error");
      throw err;
    }
  }, [addNotification]);

  /**
   * Transition an issue
   */
  const handleTransitionIssue = useCallback(async (
    issueIdOrKey: string,
    transitionId: string
  ) => {
    try {
      await transitionIssue(issueIdOrKey, transitionId);
      addNotification("Issue transitioned successfully", "success");
      
      // Reload the issue to get updated status
      await loadIssue();
    } catch (err) {
      console.error("Error transitioning issue:", err);
      addNotification("Failed to transition issue", "error");
      throw err;
    }
  }, [addNotification, loadIssue]);

  // Load data when issueKey changes - staggered to prevent resource exhaustion
  useEffect(() => {
    if (issueKey) {
      // Load primary data first
      loadIssue(0);
      
      // Stagger secondary data loads to prevent resource exhaustion
      setTimeout(() => {
        loadComments(0);
      }, 100);
      
      setTimeout(() => {
        loadAttachments(0);
      }, 200);
      
      setTimeout(() => {
        loadProposals(undefined, 0);
      }, 300);
    }
  }, [issueKey, loadIssue, loadComments, loadAttachments, loadProposals]);

  return {
    // State
    issues,
    setIssues,
    selectedIssue,
    setSelectedIssue,
    loading,
    error,
    
    // Filters
    searchTerm,
    setSearchTerm,
    selectedProject,
    setSelectedProject,
    selectedAssignee,
    setSelectedAssignee,
    selectedIssueType,
    setSelectedIssueType,
    selectedStatus,
    setSelectedStatus,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    
    // Dropdown data
    assignees,
    setAssignees,
    issueTypes,
    setIssueTypes,
    statuses,
    setStatuses,
    customFields,
    setCustomFields,
    
    // Comments
    comments,
    setComments,
    newComment,
    setNewComment,
    isAddingComment,
    replyingToCommentId,
    setReplyingToCommentId,
    replyText,
    setReplyText,
    
    // Attachments and proposals
    attachments,
    setAttachments,
    proposals,
    setProposals,
    isLoadingProposals,
    
    // Proposal form state
    currentProposal,
    setCurrentProposal,
    submittedProposals,
    setSubmittedProposals,
    hasSubmittedFinalQuote,
    setHasSubmittedFinalQuote,
    unitCost,
    setUnitCost,
    editableLicenseCount,
    setEditableLicenseCount,
    proposalComment,
    setProposalComment,
    quoteAttachments,
    setQuoteAttachments,
    
    // UI state
    isSubmittingQuote,
    previewProposal,
    setPreviewProposal,
    
    // Functions
    loadIssue,
    loadComments,
    loadAttachments,
    loadProposals,
    handleAddComment,
    handleSubmitProposal,
    handleUpdateIssue,
    handleTransitionIssue
  };
};