// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { userService } from "../services/userService";

interface AuthContextType {
  currentUser: User | null;
  userRole: string | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isApprover: boolean;
  isRequester: boolean;
  hasRole?: (role: string) => boolean;
  hasAnyRole?: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isApprover, setIsApprover] = useState(false);
  const [isRequester, setIsRequester] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          // Auto-sync user with default role if not already in database
          const syncResult = await userService.autoSyncUser(user.uid);
          setUserRole(syncResult.role);
          setIsAdmin(syncResult.role === 'ADMIN' || syncResult.role === 'SUPER_ADMIN');
          setIsSuperAdmin(syncResult.role === 'SUPER_ADMIN');
          setIsApprover(syncResult.role === 'APPROVER');
          setIsRequester(syncResult.role === 'REQUESTER');
        } catch (error) {
          console.error("Error auto-syncing user:", error);
          // Set default values if sync fails
          setUserRole('REQUESTER');
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsApprover(false);
          setIsRequester(true);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsApprover(false);
        setIsRequester(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    isAdmin,
    isSuperAdmin,
    isApprover,
    isRequester
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  // Helper functions for role checking
  const hasRole = (role: string) => context.userRole === role;
  const hasAnyRole = (roles: string[]) => roles.includes(context.userRole || '');
  
  return {
    ...context,
    hasRole,
    hasAnyRole
  };
}