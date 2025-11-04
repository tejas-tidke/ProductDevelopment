// src/hooks/useRegister.ts
import { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
    } catch (err) {
      // Log the error for debugging
      console.error("Registration error:", err);
      
      let errorMessage = "Failed to create account";
      if (err instanceof Error) {
        // Firebase error codes
        if (err.message.includes("email-already-in-use")) {
          errorMessage = "An account already exists with this email";
        } else if (err.message.includes("invalid-email")) {
          errorMessage = "Invalid email address";
        } else if (err.message.includes("weak-password")) {
          errorMessage = "Password should be at least 6 characters";
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

  return { register, loading, error };
};