// services/userService.ts
import { apiCall } from "./api";
 
export const userService = {
  // Get user role and data from backend (uses Authorization via api.ts)
  getUserData: async (uid: string) => {
    // Use the generic apiCall to ensure Authorization header is attached
    try {
      const userData = await apiCall(`/api/auth/role/${uid}`);
      return userData;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  },
 
  // Sync current user to backend
  syncCurrentUser: async (uid: string, email: string | null, name: string | null) => {
    // POST /auth/sync-firebase-user with Authorization via api.ts
    return await apiCall("/api/auth/sync-firebase-user", {
      method: "POST",
      body: JSON.stringify({ uid, email: email || "", name: name || "" }),
    });
  },
 
  // Sync all users to backend
  syncAllUsers: async () => {
    return await apiCall("/api/auth/sync-all-firebase-users", {
      method: "POST",
    });
  },
 
  // Automatically sync user with default role if not already in database
  autoSyncUser: async (uid: string) => {
    return await apiCall("/api/auth/auto-sync", {
      method: "POST",
      body: JSON.stringify({ uid }),
    });
  },
 
  // Get database status
  getDatabaseStatus: async () => {
    return await apiCall("/api/auth/db-status");
  },
 
  // Update user avatar
  updateUserAvatar: async (uid: string, avatar: string) => {
    return await apiCall(`/api/auth/avatar/${uid}`, {
      method: "PUT",
      body: JSON.stringify({ avatar }),
    });
  },
};