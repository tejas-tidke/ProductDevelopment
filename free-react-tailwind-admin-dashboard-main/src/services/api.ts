// src/services/api.ts
import { auth } from "../firebase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Helper function to get auth token
async function getAuthToken() {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
}

// Generic API call function
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }
  
  return response.json();
}

// User API functions
export const userApi = {
  // Get all users
  getAllUsers: () => apiCall("/api/users"),
  
  // Get user by ID
  getUserById: (id: string) => apiCall(`/api/users/${id}`),
  
  // Create a new user in Firebase and sync to database
  createFirebaseUser: (userData: { email: string; password: string; name: string; role: string }) => apiCall("/api/auth/create-user", {
    method: "POST",
    body: JSON.stringify(userData),
  }),
  
  // Create a new user (existing endpoint)
  createUser: (userData: { [key: string]: string | number | boolean }) => apiCall("/api/users", {
    method: "POST",
    body: JSON.stringify(userData),
  }),
  
  // Update user
  updateUser: (id: string, userData: { [key: string]: string | number | boolean }) => apiCall(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  }),
  
  // Delete user
  deleteUser: (id: string) => apiCall(`/api/users/${id}`, {
    method: "DELETE",
  }),
  
  // Disable user
  disableUser: (id: string) => apiCall(`/api/auth/users/${id}/disable`, {
    method: "PUT",
  }),
  
  // Enable user
  enableUser: (id: string) => apiCall(`/api/auth/users/${id}/enable`, {
    method: "PUT",
  }),
};

export default { userApi };