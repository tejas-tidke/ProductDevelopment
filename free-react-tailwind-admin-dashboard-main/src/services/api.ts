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

async function readResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      return await response.json();
    }
    const text = await response.text();
    return text;
  } catch (e) {
    return null;
  }
}

// Generic API call function
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();

  const config: RequestInit = {
    // Keep existing options last so caller can override
    credentials: options.credentials,
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    body: options.body,
  };

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, config);

  if (!response.ok) {
    const body = await readResponseBody(response);
    const bodyMsg = typeof body === "string" ? body : body?.error || body?.message || JSON.stringify(body);
    const err = new Error(`API ${response.status} ${response.statusText} at ${url}${bodyMsg ? `: ${bodyMsg}` : ""}`);
    // Attach details for callers that want to inspect
    (err as any).status = response.status;
    (err as any).body = body;
    throw err;
  }

  const data = await readResponseBody(response);
  return data;
}

// User API functions
export const userApi = {
  // Get all users
  getAllUsers: () => apiCall("/api/users"),

  // Get user by ID
  getUserById: (id: string) => apiCall(`/api/users/${id}`),

  // Create a new user in Firebase and sync to database
  createFirebaseUser: (userData: { email: string; password: string; name: string; role: string }) =>
    apiCall("/api/auth/create-user", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  // Create a new user (existing endpoint)
  createUser: (userData: { [key: string]: string | number | boolean }) =>
    apiCall("/api/users", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  // Update user
  updateUser: (id: string, userData: { [key: string]: string | number | boolean }) =>
    apiCall(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    }),

  // Delete user
  deleteUser: (id: string) =>
    apiCall(`/api/users/${id}`, {
      method: "DELETE",
    }),

  // Disable user
  disableUser: (id: string) =>
    apiCall(`/api/auth/users/${id}/disable`, {
      method: "PUT",
    }),

  // Enable user
  enableUser: (id: string) =>
    apiCall(`/api/auth/users/${id}/enable`, {
      method: "PUT",
    }),
};

export default { userApi };