// services/userService.ts
const API_BASE_URL = "http://localhost:8080/api";

export const userService = {
  // Get user role and data from backend
  getUserData: async (uid: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/role/${uid}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null; // User not found
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  },

  // Sync current user to backend
  syncCurrentUser: async (uid: string, email: string | null, name: string | null) => {
    const response = await fetch(`${API_BASE_URL}/auth/sync-firebase-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid,
        email: email || "",
        name: name || "",
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to sync user: ${response.status}`);
    }
    
    return await response.json();
  },

  // Sync all users to backend
  syncAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/sync-all-firebase-users`, {
      method: "POST",
    });
    
    if (!response.ok) {
      throw new Error(`Failed to sync all users: ${response.status}`);
    }
    
    return await response.json();
  },

  // Automatically sync user if not already in database
  autoSyncUser: async (uid: string, email: string | null, name: string | null) => {
    try {
      // First check if user exists in backend
      const userData = await userService.getUserData(uid);
      
      // If user doesn't exist, sync them
      if (!userData) {
        return await userService.syncCurrentUser(uid, email, name);
      }
      
      return userData;
    } catch {
      // If there's an error checking user data, try to sync anyway
      // We ignore the error as we're proceeding with sync anyway
      return await userService.syncCurrentUser(uid, email, name);
    }
  },

  // Get database status
  getDatabaseStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/db-status`);
    if (!response.ok) {
      throw new Error(`Failed to get database status: ${response.status}`);
    }
    return await response.json();
  },

  // Update user avatar
  updateUserAvatar: async (uid: string, avatar: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/avatar/${uid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        avatar,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update user avatar: ${response.status}`);
    }
    
    return await response.json();
  }
};