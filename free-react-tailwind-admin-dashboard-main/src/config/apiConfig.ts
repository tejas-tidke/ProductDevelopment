// API Configuration - Centralized URL management to prevent CORS issues
// This file ensures all API calls use consistent, configurable endpoints

/**
 * Application environment configuration
 * Controls API endpoints based on deployment environment
 */
const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production'
};

/**
 * Current environment - defaults to development
 */
const CURRENT_ENV = import.meta.env.MODE || ENV.DEVELOPMENT;

/**
 * Base URLs configuration
 * These URLs should match your backend server configuration and CORS settings
 */
export const API_BASE_URLS = {
  // Local development URLs
  LOCALHOST: 'http://localhost:8080',
  LOCALHOST_IP: 'http://127.0.0.1:8080',
  NETWORK_IP: 'http://192.168.1.115:8080',
  
  // Production URLs (update these with your actual production URLs)
  PRODUCTION: 'https://your-production-domain.com',
  
  // Default fallback
  DEFAULT: 'http://localhost:8080'
};

/**
 * Frontend URLs configuration
 * Used for redirects and CORS configuration
 */
export const FRONTEND_URLS = {
  // Development URLs
  LOCALHOST: 'http://localhost:5173',
  LOCALHOST_IP: 'http://127.0.0.1:5173',
  NETWORK_IP: 'http://192.168.1.115:5173',
  
  // Production URLs
  PRODUCTION: 'https://your-frontend-domain.com',
  
  // Default fallback
  DEFAULT: 'http://localhost:5173'
};

/**
 * Get the appropriate API base URL based on environment
 * @returns {string} The base URL for API calls
 */
export function getApiBaseUrl(): string {
  // Check for explicit environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Determine URL based on current environment
  switch (CURRENT_ENV) {
    case ENV.PRODUCTION:
      return API_BASE_URLS.PRODUCTION;
    case ENV.DEVELOPMENT:
    default:
      // Try to detect the current host
      const hostname = window.location.hostname;
      if (hostname === 'localhost') {
        return API_BASE_URLS.LOCALHOST;
      } else if (hostname === '127.0.0.1') {
        return API_BASE_URLS.LOCALHOST_IP;
      } else if (hostname === '192.168.1.115') {
        return API_BASE_URLS.NETWORK_IP;
      }
      // Fallback to default
      return API_BASE_URLS.DEFAULT;
  }
}

/**
 * Get the appropriate frontend URL based on environment
 * @returns {string} The base URL for frontend
 */
export function getFrontendUrl(): string {
  // Check for explicit environment variable first
  if (import.meta.env.VITE_FRONTEND_URL) {
    return import.meta.env.VITE_FRONTEND_URL;
  }
  
  // Determine URL based on current environment
  switch (CURRENT_ENV) {
    case ENV.PRODUCTION:
      return FRONTEND_URLS.PRODUCTION;
    case ENV.DEVELOPMENT:
    default:
      // Try to detect the current host
      const hostname = window.location.hostname;
      if (hostname === 'localhost') {
        return FRONTEND_URLS.LOCALHOST;
      } else if (hostname === '127.0.0.1') {
        return FRONTEND_URLS.LOCALHOST_IP;
      } else if (hostname === '192.168.1.115') {
        return FRONTEND_URLS.NETWORK_IP;
      }
      // Fallback to default
      return FRONTEND_URLS.DEFAULT;
  }
}

/**
 * Construct a full API URL
 * @param {string} endpoint - The API endpoint (e.g., '/api/users')
 * @returns {string} The complete URL
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${getApiBaseUrl()}/${cleanEndpoint}`;
}

/**
 * API Endpoints - Centralized list of all API endpoints
 * This prevents typos and makes it easier to update URLs
 */
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    CHECK_USER_EXISTS: '/api/auth/check-user-exists',
    CREATE_USER: '/api/auth/create-user',
    SYNC_FIREBASE_USER: '/api/auth/sync-firebase-user',
    AUTO_SYNC: '/api/auth/auto-sync',
    ROLE: '/api/auth/role',
    DB_STATUS: '/api/auth/db-status',
    AVATAR: '/api/auth/avatar'
  },
  
  // User endpoints
  USERS: {
    BASE: '/api/users',
    BY_ID: (id: string) => `/api/users/${id}`,
    BY_ORGANIZATION_AND_DEPARTMENT: (orgId?: string, deptId?: string) => {
      let url = '/api/users';
      const params = new URLSearchParams();
      if (orgId) params.append('organizationId', orgId);
      if (deptId) params.append('departmentId', deptId);
      const queryString = params.toString();
      return queryString ? `${url}?${queryString}` : url;
    },
    DEPARTMENTS: '/api/users/departments',
    DEPARTMENT_BY_ID: (id: string) => `/api/users/departments/${id}`
  },
  
  // Organization endpoints
  ORGANIZATIONS: {
    BASE: '/api/organizations',
    BY_ID: (id: string) => `/api/organizations/${id}`,
    CHILDREN: (id: string) => `/api/organizations/${id}/children`
  },
  
  // Invitation endpoints
  INVITATIONS: {
    CREATE: '/api/invitations/create',
    CREATE_FIREBASE: '/api/invitations/create-firebase',
    VERIFY: (token: string, email: string) => `/api/invitations/verify?token=${token}&email=${email}`,
    VERIFY_EMAIL: (email: string) => `/api/invitations/verify-email?email=${email}`,
    COMPLETE: '/api/invitations/complete'
  },
  
  // Notification endpoints
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    UNREAD_COUNT: '/api/notifications/unread-count',
    MARK_AS_READ: (id: string) => `/api/notifications/${id}/mark-as-read`,
    MARK_ALL_AS_READ: '/api/notifications/mark-all-as-read'
  },
  
  // Jira endpoints
  JIRA: {
    BASE: '/api/jira',
    CONTRACTS: {
      BASE: '/api/jira/contracts',
      COMPLETED: '/api/jira/contracts/completed',
      MANUAL: '/api/jira/contracts/manual',
      ADD_PROPOSAL: '/api/jira/contracts/add-proposal',
      SAVE_ATTACHMENT: '/api/jira/contracts/save-attachment',
      UPDATE_LICENSE_COUNT: '/api/jira/contracts/update-license-count',
      FINAL_SUBMIT: (issueKey: string) => `/api/jira/contracts/final-submit/${issueKey}`,
      PROFIT: (issueKey: string) => `/api/jira/contracts/profit/${issueKey}`,
      MARK_COMPLETED: '/api/jira/contracts/mark-completed',
      BY_ISSUE_KEY: (issueKey: string) => `/api/jira/contracts/byIssueKey/${issueKey}`
    },
    PROPOSALS: {
      BASE: '/api/jira/proposals',
      BY_ID: (id: string) => `/api/jira/proposals/${id}`,
      BY_ISSUE: (issueKey: string) => `/api/jira/proposals/issue/${encodeURIComponent(issueKey)}`
    },
    ISSUES: {
      BASE: '/api/jira/issues',
      CREATE: '/api/jira/issues/create',
      BY_ID: (issueKey: string) => `/api/jira/issues/${encodeURIComponent(issueKey)}`
    },
    ATTACHMENT: {
      CONTENT: (id: string) => `/api/jira/attachment/content/${id}`
    }
  }
};

// Export default configuration
export default {
  ENV,
  CURRENT_ENV,
  API_BASE_URLS,
  FRONTEND_URLS,
  getApiBaseUrl,
  getFrontendUrl,
  getApiUrl,
  API_ENDPOINTS
};