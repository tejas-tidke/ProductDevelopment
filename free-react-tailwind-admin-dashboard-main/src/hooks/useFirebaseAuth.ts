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
      
      let errorMessage = "Failed to sign in";
      if (err instanceof Error) {
        // Firebase error codes
        if (err.message.includes("invalid-credential")) {
          errorMessage = "Invalid email or password";
        } else if (err.message.includes("user-disabled")) {
          errorMessage = "This account has been disabled";
        } else if (err.message.includes("user-not-found")) {
          errorMessage = "No account found with this email";
        } else if (err.message.includes("wrong-password")) {
          errorMessage = "Incorrect password";
        } else {
          errorMessage = err.message;
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