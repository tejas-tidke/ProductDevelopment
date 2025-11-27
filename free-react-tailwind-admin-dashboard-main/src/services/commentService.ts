// src/services/commentService.ts
// Service for handling custom comment API calls
import { apiCall } from "./api";

// Define the comment data type
export interface Comment {
  id: number;
  issueKey: string;
  userId: number;
  userName: string;
  commentText: string;
  createdAt: string;
  updatedAt: string;
}

// Define the create comment data type
export interface CreateCommentDto {
  issueKey: string;
  userId: number;
  userName: string;
  commentText: string;
}

export const commentService = {
  // Get comments for a specific issue
  getCommentsByIssueKey: async (issueKey: string) => {
    try {
      const response = await apiCall(`/api/comments/issue/${issueKey}`);
      return response;
    } catch (error) {
      console.error("Error fetching comments:", error);
      throw error;
    }
  },

  // Add a new comment
  addComment: async (commentData: CreateCommentDto) => {
    try {
      const response = await apiCall("/api/comments", {
        method: "POST",
        body: JSON.stringify(commentData),
      });
      return response;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  },
};

export default commentService;