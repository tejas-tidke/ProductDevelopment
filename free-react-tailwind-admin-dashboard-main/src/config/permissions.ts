// src/config/permissions.ts
// Centralized permission configuration for all user roles

// Define all possible permissions
export enum Permission {
  // User Management
  VIEW_USERS = 'VIEW_USERS',
  CREATE_USER = 'CREATE_USER',
  EDIT_USER = 'EDIT_USER',
  DELETE_USER = 'DELETE_USER',
  
  // Issue Management
  VIEW_ISSUES = 'VIEW_ISSUES',
  CREATE_ISSUE = 'CREATE_ISSUE',
  EDIT_ISSUE = 'EDIT_ISSUE',
  DELETE_ISSUE = 'DELETE_ISSUE',
  TRANSITION_ISSUE = 'TRANSITION_ISSUE',
  
  // Department Access
  VIEW_DEPARTMENT_ISSUES = 'VIEW_DEPARTMENT_ISSUES',
  
  // Dashboard Access
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  
  // Reports Access
  VIEW_REPORTS = 'VIEW_REPORTS',
  
  // Vendor Management
  VIEW_VENDORS = 'VIEW_VENDORS',
  CREATE_VENDOR = 'CREATE_VENDOR',
  EDIT_VENDOR = 'EDIT_VENDOR',
  DELETE_VENDOR = 'DELETE_VENDOR',
  
  // Procurement Management
  VIEW_PROCUREMENT_RENEWAL = 'VIEW_PROCUREMENT_RENEWAL',
  
  // Contracts Management
  VIEW_CONTRACTS = 'VIEW_CONTRACTS',
  CREATE_CONTRACT = 'CREATE_CONTRACT',
  EDIT_CONTRACT = 'EDIT_CONTRACT',
  DELETE_CONTRACT = 'DELETE_CONTRACT',
  
  // Invitations
  SEND_INVITATIONS = 'SEND_INVITATIONS',
  VIEW_INVITATIONS = 'VIEW_INVITATIONS',
  DELETE_INVITATIONS = 'DELETE_INVITATIONS',
  
  // Organization Management
  MANAGE_ORGANIZATIONS = 'MANAGE_ORGANIZATIONS',
}

// Define role-based permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    // Full access to everything
    Permission.VIEW_USERS,
    Permission.CREATE_USER,
    Permission.EDIT_USER,
    Permission.DELETE_USER,
    
    Permission.VIEW_ISSUES,
    Permission.CREATE_ISSUE,
    Permission.EDIT_ISSUE,
    Permission.DELETE_ISSUE,
    Permission.TRANSITION_ISSUE,
    
    Permission.VIEW_DEPARTMENT_ISSUES,
    
    Permission.VIEW_DASHBOARD,
    
    Permission.VIEW_REPORTS,
    
    Permission.VIEW_VENDORS,
    Permission.CREATE_VENDOR,
    Permission.EDIT_VENDOR,
    Permission.DELETE_VENDOR,
    
    Permission.VIEW_CONTRACTS,
    Permission.CREATE_CONTRACT,
    Permission.EDIT_CONTRACT,
    Permission.DELETE_CONTRACT,
    
    Permission.VIEW_PROCUREMENT_RENEWAL,
    
    Permission.SEND_INVITATIONS,
    Permission.VIEW_INVITATIONS,
    Permission.DELETE_INVITATIONS,
    
    Permission.MANAGE_ORGANIZATIONS,
  ],
  
  ADMIN: [
    // Full access except user role management
    Permission.VIEW_USERS,
    Permission.CREATE_USER,
    Permission.EDIT_USER,
    Permission.DELETE_USER,
    
    Permission.VIEW_ISSUES,
    Permission.CREATE_ISSUE,
    Permission.EDIT_ISSUE,
    Permission.DELETE_ISSUE,
    Permission.TRANSITION_ISSUE,
    
    Permission.VIEW_DEPARTMENT_ISSUES,
    
    Permission.VIEW_DASHBOARD,
    
    Permission.VIEW_REPORTS,
    
    Permission.VIEW_VENDORS,
    Permission.CREATE_VENDOR,
    Permission.EDIT_VENDOR,
    Permission.DELETE_VENDOR,
    
    Permission.VIEW_CONTRACTS,
    Permission.CREATE_CONTRACT,
    Permission.EDIT_CONTRACT,
    Permission.DELETE_CONTRACT,
    
    Permission.VIEW_PROCUREMENT_RENEWAL,
    
    Permission.SEND_INVITATIONS,
    Permission.VIEW_INVITATIONS,
    Permission.DELETE_INVITATIONS,
  ],
  
  APPROVER: [
    // Can view and manage issues, but limited user management
    Permission.VIEW_USERS,
    
    Permission.VIEW_ISSUES,
    Permission.CREATE_ISSUE,
    Permission.EDIT_ISSUE,
    Permission.DELETE_ISSUE,
    Permission.TRANSITION_ISSUE,
    
    Permission.VIEW_DEPARTMENT_ISSUES,
    
    Permission.VIEW_DASHBOARD,
    
    Permission.VIEW_REPORTS,
  ],
  
  REQUESTER: [
    // Limited access - can only view issues in their department
    // Cannot create users, view dashboard, edit issues, or transition issues
    Permission.VIEW_ISSUES,
    Permission.VIEW_DEPARTMENT_ISSUES,
  ]
};

// Define department-based access rules
export interface DepartmentAccessRule {
  roleId: string;
  departmentId: number | null; // null means all departments
  canViewAllDepartments: boolean;
}

// Default department access rules
export const DEFAULT_DEPARTMENT_ACCESS: Record<string, DepartmentAccessRule> = {
  SUPER_ADMIN: {
    roleId: 'SUPER_ADMIN',
    departmentId: null, // Can access all departments
    canViewAllDepartments: true
  },
  ADMIN: {
    roleId: 'ADMIN',
    departmentId: null, // Can access all departments
    canViewAllDepartments: true
  },
  APPROVER: {
    roleId: 'APPROVER',
    departmentId: null, // Can access all departments by default
    canViewAllDepartments: true
  },
  REQUESTER: {
    roleId: 'REQUESTER',
    departmentId: null, // Will be set to user's department
    canViewAllDepartments: false // Can only access their own department
  }
};

// Permission checking functions
export const hasPermission = (userRole: string | null, permission: Permission): boolean => {
  console.log('hasPermission: userRole=', userRole, 'permission=', permission);
  if (!userRole) return false;
  
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  const result = permissions.includes(permission);
  console.log('hasPermission: result=', result);
  return result;
};

export const hasAnyPermission = (userRole: string | null, permissions: Permission[]): boolean => {
  console.log('hasAnyPermission: userRole=', userRole, 'permissions=', permissions);
  if (!userRole) return false;
  
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  const result = permissions.some(permission => userPermissions.includes(permission));
  console.log('hasAnyPermission: result=', result);
  return result;
};

export const hasAllPermissions = (userRole: string | null, permissions: Permission[]): boolean => {
  console.log('hasAllPermissions: userRole=', userRole, 'permissions=', permissions);
  if (!userRole) return false;
  
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  const result = permissions.every(permission => userPermissions.includes(permission));
  console.log('hasAllPermissions: result=', result);
  return result;
};

// Check if user can access a specific department
export const canAccessDepartment = (
  userRole: string | null, 
  userDepartmentId: number | null | undefined,
  targetDepartmentId: number | null | undefined
): boolean => {
  if (!userRole) return false;
  
  const accessRule = DEFAULT_DEPARTMENT_ACCESS[userRole];
  
  // If user can view all departments, they can access any department
  if (accessRule.canViewAllDepartments) {
    return true;
  }
  
  // For REQUESTER role, they can only access issues in their own department
  if (userRole === 'REQUESTER') {
    return userDepartmentId === targetDepartmentId;
  }
  
  // For other roles, they can access all departments by default
  return true;
};