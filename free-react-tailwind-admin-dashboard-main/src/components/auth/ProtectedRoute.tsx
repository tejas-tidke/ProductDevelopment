// src/components/auth/ProtectedRoute.tsx
import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentUser) {
      // Redirect to sign in page if user is not authenticated
      navigate("/signin");
    }
  }, [currentUser, loading, navigate]);

  // Show loading state while checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If user is not authenticated, don't render children (redirect is handled by useEffect)
  if (!currentUser) {
    return null;
  }

  // If user is authenticated, render children
  return <>{children}</>;
}