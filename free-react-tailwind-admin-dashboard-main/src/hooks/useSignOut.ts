// src/hooks/useSignOut.ts
import { useState } from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

export const useSignOut = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await signOut(auth);
      return { success: true, error: null };
    } catch (err) {
      // Log the error for debugging
      console.error("Sign out error:", err);
      
      let errorMessage = "Failed to sign out";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { signOut: handleSignOut, loading, error };
};