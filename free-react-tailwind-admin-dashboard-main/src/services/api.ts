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
export async function apiCall(endpoint: string, options: RequestInit = {}) {
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
    // Try to parse error response, fallback to status text if not possible
    let errorMessage = `API call failed: ${response.status} ${response.statusText}`;
    
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } else {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      }
    } catch (parseError) {
      // If parsing fails, use the status text
      console.warn("Failed to parse error response:", parseError);
    }
    
    throw new Error(errorMessage);
  }
  
  // Check if response is JSON
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  } else {
    // Return text for non-JSON responses
    return response.text();
  }
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

// Department API functions
export const departmentApi = {
  // Get all departments
  getAllDepartments: () => apiCall("/api/users/departments"),
  
  // Get department by ID
  getDepartmentById: (id: string) => apiCall(`/api/users/departments/${id}`),
};

export default { userApi, departmentApi };