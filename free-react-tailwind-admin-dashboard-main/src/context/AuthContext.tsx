// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
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
          const syncResult = await userService.autoSyncUser(user.uid);
          const role = syncResult?.role ?? "REQUESTER";
          setUserRole(role);
          setIsAdmin(role === "ADMIN" || role === "SUPER_ADMIN");
          setIsSuperAdmin(role === "SUPER_ADMIN");
          setIsApprover(role === "APPROVER");
          setIsRequester(role === "REQUESTER");
        } catch (error) {
          console.error("Error auto-syncing user:", error);
          // fallback defaults
          setUserRole("REQUESTER");
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

    return () => unsubscribe();
  }, []);

  // Stable helper functions included in context value
  const hasRole = (role: string) => userRole === role;
  const hasAnyRole = (roles: string[]) => roles.includes(userRole ?? "");

  const value: AuthContextType = {
    currentUser,
    userRole,
    loading,
    isAdmin,
    isSuperAdmin,
    isApprover,
    isRequester,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
