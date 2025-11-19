// src/hooks/usePermissions.ts
import { useAuth } from "../context/AuthContext";
import { Permission } from "../config/permissions";
import { useCallback } from "react";

// Custom hook for permission checking
export const usePermissions = () => {
  const {
    userRole,
    userDepartmentId,
    userDepartmentName,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole
  } = useAuth();

  // Check if user can access a specific department's issues
  const canAccessDepartmentIssues = useCallback((targetDepartment: string | null | undefined): boolean => {
    if (!userRole) return false;
    
    // SUPER_ADMIN and ADMIN can access all departments
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      return true;
    }
    
    // APPROVER can access all departments by default
    if (userRole === 'APPROVER') {
      return true;
    }
    
    // REQUESTER can only access issues in their own department
    if (userRole === 'REQUESTER') {
      // Compare department names (strings) instead of IDs
      if (userDepartmentName === null || targetDepartment === null || targetDepartment === undefined) {
        // If either department is null/undefined, allow access
        return true;
      }
      
      // Compare the user's department name with the target department name
      return userDepartmentName === targetDepartment;
    }
    
    return false;
  }, [userRole, userDepartmentName]);

  // Check if user can edit an issue
  const canEditIssue = useCallback((): boolean => {
    return hasPermission(Permission.EDIT_ISSUE);
  }, [hasPermission]);

  // Check if user can transition an issue
  const canTransitionIssue = useCallback((): boolean => {
    return hasPermission(Permission.TRANSITION_ISSUE);
  }, [hasPermission]);

  // Check if user can view the dashboard
  const canViewDashboard = useCallback((): boolean => {
    return hasPermission(Permission.VIEW_DASHBOARD);
  }, [hasPermission]);

  // Check if user can view users list
  const canViewUsersList = useCallback((): boolean => {
    return hasPermission(Permission.VIEW_USERS);
  }, [hasPermission]);

  // Check if user can create users
  const canCreateUsers = useCallback((): boolean => {
    return hasPermission(Permission.CREATE_USER);
  }, [hasPermission]);

  // Check if user can send invitations
  const canSendInvitations = useCallback((): boolean => {
    return hasPermission(Permission.SEND_INVITATIONS);
  }, [hasPermission]);

  // Check if user can manage organizations
  const canManageOrganizations = useCallback((): boolean => {
    return hasPermission(Permission.MANAGE_ORGANIZATIONS);
  }, [hasPermission]);

  return {
    userRole,
    userDepartmentId,
    userDepartmentName,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    canAccessDepartmentIssues,
    canEditIssue,
    canTransitionIssue,
    canViewDashboard,
    canViewUsersList,
    canCreateUsers,
    canSendInvitations,
    canManageOrganizations
  };
};