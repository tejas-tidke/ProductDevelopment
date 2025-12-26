// src/hooks/useFirebaseAuth.ts
import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export const useFirebaseAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
    } catch (err) {
      // Log the error for debugging
      console.error("Sign in error:", err);
      
      let errorMessage = "Failed to sign in. Please try again.";
      if (err instanceof Error) {
        // Firebase error codes
        if (err.message.includes("invalid-credential")) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (err.message.includes("user-disabled")) {
          errorMessage = "This account has been disabled. Please contact an administrator.";
        } else if (err.message.includes("user-not-found")) {
          errorMessage = "No account found with this email. Please check your email or sign up.";
        } else if (err.message.includes("wrong-password")) {
          errorMessage = "Incorrect password. Please try again.";
        } else if (err.message.includes("too-many-requests")) {
          errorMessage = "Too many failed attempts. Please try again later.";
        } else if (err.message.includes("network-request-failed")) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else {
          // Generic error message for unknown errors
          errorMessage = "Unable to sign in. Please check your credentials and try again.";
        }
      }
      
      setError(errorMessage);
      return { user: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading, error };
};