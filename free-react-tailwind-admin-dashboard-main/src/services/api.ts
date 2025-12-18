// services/api.ts
import { auth } from "../firebase";

// Generic API call function with automatic Authorization header
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  // Get the current user's ID token
  const user = auth.currentUser;
  let idToken = null;
  if (user) {
    try {
      idToken = await user.getIdToken();
    } catch (error) {
      console.error("Error getting ID token:", error);
    }
  }

  // Prepare headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add Authorization header if we have a token
  if (idToken) {
    headers["Authorization"] = `Bearer ${idToken}`;
  }

  // Merge with any existing headers
  Object.assign(headers, options.headers || {});

  // Prepare the full URL
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const url = `${apiUrl}${endpoint}`;

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle non-OK responses
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      // Try to parse the error response as JSON
      const errorText = await response.text();
      const errorData = JSON.parse(errorText);
      if (errorData.error) {
        errorMessage = errorData.error;
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
  
  // Get users by organization and department
  getUsersByOrganizationAndDepartment: (organizationId: number | null, departmentId: number | null) => {
    if (organizationId && departmentId) {
      return apiCall(`/api/users?organizationId=${organizationId}&departmentId=${departmentId}`);
    } else if (organizationId) {
      return apiCall(`/api/users?organizationId=${organizationId}`);
    } else if (departmentId) {
      return apiCall(`/api/users?departmentId=${departmentId}`);
    }
    return apiCall("/api/users");
  },
  
  // Get user by ID
  getUserById: (id: string) => apiCall(`/api/users/${id}`),
  
  // Create a new user in Firebase and sync to database
  createFirebaseUser: (userData: { 
    email: string; 
    password: string; 
    name: string; 
    role: string;
    department?: { id: number } | null;
    organization?: { id: number } | null;
  }) => apiCall("/api/auth/create-user", {
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


  // Delete user by Firebase UID (Auth route)
  deleteUserByUid: (uid: string) => apiCall(`/api/auth/users/${uid}`, {
    method: "DELETE",
  }),
  
  // Disable user
  // Disable user (set active=false)
disableUser: (id: string) =>
  apiCall(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify({ active: false })
  }),

// Enable user (set active=true)
enableUser: (id: string) =>
  apiCall(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify({ active: true })
  }),

// Delete user using DB ID
deleteUser: (id: string) =>
  apiCall(`/api/users/${id}`, {
    method: "DELETE"
  }),

};

// Department API functions
export const departmentApi = {
  // Get all departments
  getAllDepartments: () => apiCall("/api/users/departments"),
  
  // Get department by ID
  getDepartmentById: (id: string) => apiCall(`/api/users/departments/${id}`),
};

// Organization API functions
export const organizationApi = {
  // Get all organizations
  getAllOrganizations: () => apiCall("/api/organizations"),
  
  // Get organization by ID
  getOrganizationById: (id: string) => apiCall(`/api/organizations/${id}`),
  
  // Create organization
  createOrganization: (orgData: { name: string; parentId?: number }) => apiCall("/api/organizations", {
    method: "POST",
    body: JSON.stringify(orgData),
  }),
  
  // Update organization
  updateOrganization: (id: string, orgData: { name: string; parentId?: number }) => apiCall(`/api/organizations/${id}`, {
    method: "PUT",
    body: JSON.stringify(orgData),
  }),
  
  // Delete organization
  deleteOrganization: (id: string) => apiCall(`/api/organizations/${id}`, {
    method: "DELETE",
  }),
  
  // Get child organizations
  getChildOrganizations: (id: string) => apiCall(`/api/organizations/${id}/children`),
};

// Invitation API functions
export const invitationApi = {
  // Create invitation
  createInvitation: (invitationData: { 
    email: string; 
    role: string; 
    departmentId: number | null; 
    organizationId?: number; 
  }) => apiCall("/api/invitations/create", {
    method: "POST",
    body: JSON.stringify(invitationData),
  }),
  
  // Create Firebase-based invitation
  createFirebaseInvitation: (invitationData: { 
    email: string; 
    role: string; 
    departmentId: number | null; 
    organizationId?: number; 
  }) => apiCall("/api/invitations/create-firebase", {
    method: "POST",
    body: JSON.stringify(invitationData),
  }),
  
  // Verify invitation
  verifyInvitation: (token: string, email: string) => apiCall(`/api/invitations/verify?token=${token}&email=${email}`),
  
  // Verify invitation by email only (for OAuth flow)
  verifyInvitationByEmail: (email: string) => apiCall(`/api/invitations/verify-email?email=${email}`),
  
  // Complete invitation
  completeInvitation: (completionData: { 
    token: string; 
    email: string; 
    fullName: string; 
    password: string 
  }) => apiCall("/api/invitations/complete", {
    method: "POST",
    body: JSON.stringify(completionData),
  }),
};

// Notification API functions
export const notificationApi = {
  // Get all notifications for the current user
  getNotifications: () => apiCall("/api/notifications"),
  
  // Get unread notifications count for the current user
  getUnreadCount: () => apiCall("/api/notifications/unread-count"),
  
  // Mark a notification as read
  markAsRead: (id: number) => apiCall(`/api/notifications/${id}/mark-as-read`, {
    method: "PUT"
  }),
  
  // Mark all notifications as read
  markAllAsRead: () => apiCall("/api/notifications/mark-all-as-read", {
    method: "PUT"
  }),
  
  // Delete a notification
  deleteNotification: (id: number) => apiCall(`/api/notifications/${id}`, {
    method: "DELETE"
  })
};

// Auth API functions
export const authApi = {
  // Check if user exists in Firebase or database by email
  checkUserExists: (email: string) => apiCall(`/api/auth/check-user-exists?email=${encodeURIComponent(email)}`),
};

export default { userApi, departmentApi, organizationApi, invitationApi, notificationApi };