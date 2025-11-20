// src/components/auth/ProtectedRoute.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [loginTime, setLoginTime] = useState<number | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!loading && !currentUser) {
      // Redirect to sign in page if user is not authenticated
      navigate("/signin");
      return;
    }

    // Set login time when user is authenticated
    if (currentUser && !loginTime) {
      const currentTime = Date.now();
      setLoginTime(currentTime);
      // Store login time in localStorage
      localStorage.setItem('loginTime', currentTime.toString());
    } else if (!loginTime) {
      // Try to get login time from localStorage
      const storedLoginTime = localStorage.getItem('loginTime');
      if (storedLoginTime) {
        setLoginTime(parseInt(storedLoginTime, 10));
      }
    }
  }, [currentUser, loading, navigate, loginTime]);

  useEffect(() => {
    // Check for 30-minute timeout
    if (loginTime) {
      const checkTimeout = () => {
        const currentTime = Date.now();
        const timeElapsed = currentTime - loginTime;
        const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds

        if (timeElapsed > thirtyMinutes) {
          // Clear login time from localStorage
          localStorage.removeItem('loginTime');
          // Redirect to sign in page
          navigate("/signin");
        }
      };

      // Check immediately
      checkTimeout();

      // Set up interval to check every minute
      const interval = setInterval(checkTimeout, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [loginTime, navigate]);

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