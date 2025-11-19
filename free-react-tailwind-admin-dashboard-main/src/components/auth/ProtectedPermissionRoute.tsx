// src/components/auth/ProtectedPermissionRoute.tsx
import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";
import { Permission } from "../../config/permissions";

interface ProtectedPermissionRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean; // If true, user must have all permissions; if false, user must have at least one
  redirectTo?: string; // Where to redirect if user doesn't have permission
}

export default function ProtectedPermissionRoute({ 
  children, 
  requiredPermissions = [],
  requireAllPermissions = true,
  redirectTo = "/" 
}: ProtectedPermissionRouteProps) {
  const { currentUser, loading, hasPermission, hasAllPermissions, hasAnyPermission } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      // If user is not authenticated, redirect to sign in
      if (!currentUser) {
        navigate("/signin");
        return;
      }

      // If no specific permissions are required, just being authenticated is enough
      if (requiredPermissions.length === 0) {
        return;
      }

      // Check if user has required permissions
      let hasRequiredPermissions = false;
      
      if (requireAllPermissions) {
        // User must have all permissions
        hasRequiredPermissions = hasAllPermissions(requiredPermissions);
      } else {
        // User must have at least one permission
        hasRequiredPermissions = hasAnyPermission(requiredPermissions);
      }

      // If user doesn't have required permissions, redirect
      if (!hasRequiredPermissions) {
        navigate(redirectTo);
      }
    }
  }, [currentUser, loading, requiredPermissions, requireAllPermissions, redirectTo, navigate, hasPermission, hasAllPermissions, hasAnyPermission]);

  // Show loading state while checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If user is not authenticated or doesn't have required permissions, don't render children
  // (redirect is handled by useEffect)
  if (!currentUser) {
    return null;
  }

  // Check permissions again before rendering
  if (requiredPermissions.length > 0) {
    let hasRequiredPermissions = false;
    
    if (requireAllPermissions) {
      hasRequiredPermissions = hasAllPermissions(requiredPermissions);
    } else {
      hasRequiredPermissions = hasAnyPermission(requiredPermissions);
    }
    
    if (!hasRequiredPermissions) {
      return null;
    }
  }

  // If user is authenticated and has required permissions, render children
  return <>{children}</>;
}