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
  console.log('ProtectedPermissionRoute: Component mounted');
  const { currentUser, loading, hasPermission, hasAllPermissions, hasAnyPermission, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('ProtectedPermissionRoute: useEffect called - loading=', loading, 'currentUser=', currentUser, 'userRole=', userRole);
    // Only check auth and permissions after we've finished loading AND user role is available
    if (!loading && userRole !== null) {
      console.log('ProtectedPermissionRoute: Finished loading and user role available, checking auth and permissions');
      // If user is not authenticated, redirect to sign in
      if (!currentUser) {
        console.log('ProtectedPermissionRoute: No user, redirecting to signin');
        navigate("/signin");
        return;
      }

      // If no specific permissions are required, just being authenticated is enough
      if (requiredPermissions.length === 0) {
        console.log('ProtectedPermissionRoute: No specific permissions required');
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
      
      console.log('ProtectedPermissionRoute: Required permissions=', requiredPermissions, 'User has permissions=', hasRequiredPermissions);

      // If user doesn't have required permissions, redirect
      if (!hasRequiredPermissions) {
        console.log('ProtectedPermissionRoute: User lacks required permissions, redirecting to', redirectTo);
        navigate(redirectTo);
      }
    } else if (!loading && userRole === null && currentUser) {
      // Special case: user is authenticated but role hasn't loaded yet
      // This can happen during page refresh
      console.log('ProtectedPermissionRoute: User authenticated but role not loaded yet, waiting...');
      // Don't redirect in this case, let the role load
    }
  }, [currentUser, loading, requiredPermissions, requireAllPermissions, redirectTo, navigate, hasPermission, hasAllPermissions, hasAnyPermission, userRole]);

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