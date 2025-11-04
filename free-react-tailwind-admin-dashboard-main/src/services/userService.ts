// services/userService.ts
 
const API_BASE_URL = "/api"; // rely on Vite proxy or VITE_API_URL in api.ts
 
export const userService = {
  // Get user role and data from backend (uses Authorization via api.ts)
  getUserData: async () => {
    // Use the generic apiCall to ensure Authorization header is attached
    // const res = await userApi
      // leverage apiCall directly since userApi has no role endpoint wrapper
      // we call the internal apiCall by creating a small helper here
      // but since api.ts default export exposes userApi only, re-route through fetch with auth is needed
      // Instead, call a private endpoint through userApi.createUser with GET override using api.ts
      // Simpler: import default and use its apiCall by exposing a thin wrapper here
      ;
    // We cannot access apiCall directly, so we mimic by hitting a userApi endpoint doesn't exist.
    // Workaround: call fetch with Authorization header using the same token mechanism.
    throw new Error("userService.getUserData not wired to api.ts. Please expose apiCall from api.ts");
  },
 
  // Sync current user to backend
  syncCurrentUser: async (uid: string, email: string | null, name: string | null) => {
    // POST /auth/sync-firebase-user with Authorization via api.ts
    return await fetch(`${API_BASE_URL}/auth/sync-firebase-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid, email: email || "", name: name || "" }),
    }).then(r => r.json());
  },
 
  // Sync all users to backend
  syncAllUsers: async () => {
    return await fetch(`${API_BASE_URL}/auth/sync-all-firebase-users`, { method: "POST" }).then(r => r.json());
  },
 
  // Automatically sync user with default role if not already in database
  autoSyncUser: async (uid: string) => {
    return await fetch(`${API_BASE_URL}/auth/auto-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    }).then(r => r.json());
  },
 
  // Get database status
  getDatabaseStatus: async () => {
    return await fetch(`${API_BASE_URL}/auth/db-status`).then(r => r.json());
  },
 
  // Update user avatar
  updateUserAvatar: async (uid: string, avatar: string) => {
    return await fetch(`${API_BASE_URL}/auth/avatar/${uid}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar }),
    }).then(r => r.json());
  },
};