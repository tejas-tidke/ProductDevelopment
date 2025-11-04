// src/components/auth/ProtectedAdminRoute.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";
import { userService } from "../../services/userService";

export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser && !loading) {
        try {
          // Get user data to check if they are admin
          const userData = await userService.getUserData(currentUser.uid);
          if (userData && userData.role === "ADMIN") {
            setIsAdmin(true);
          } else {
            // Redirect to home page if user is not admin
            navigate("/");
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          // Redirect to home page if there's an error
          navigate("/");
        } finally {
          setIsAdminLoading(false);
        }
      } else if (!loading && !currentUser) {
        // Redirect to sign in page if user is not authenticated
        navigate("/signin");
      }
    };

    checkAdminStatus();
  }, [currentUser, loading, navigate]);

  // Show loading state while checking auth status
  if (loading || isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If user is not authenticated or not admin, don't render children (redirect is handled by useEffect)
  if (!currentUser || !isAdmin) {
    return null;
  }

  // If user is authenticated and is admin, render children
  return <>{children}</>;
}