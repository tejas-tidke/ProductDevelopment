import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { invitationApi } from "../services/api";
import { useNavigate, useLocation } from "react-router";
import { signInWithPopup, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

// Define interface for invitation data
interface InvitationData {
  email: string;
  role: string;
  departmentId?: number;
  organization?: string;
}

export default function CompleteInvitation() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract email from URL query parameters (no more token)
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get("email") || "";
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: string, text: string} | null>(null);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(true);

  // Verify the invitation when component mounts
  useEffect(() => {
    const verifyInvitation = async () => {
      if (!email) {
        setMessage({type: "error", text: "Invalid invitation. Email is required."});
        setVerificationLoading(false);
        return;
      }
      
      try {
        // Check if there's a pending invitation for this email
        const response = await invitationApi.verifyInvitationByEmail(email); // Use email-only verification
        if (response.valid) {
          setInvitationData(response);
          setMessage({type: "success", text: "Invitation verified successfully. Please sign in with your Google or Microsoft account."});
        } else {
          setMessage({type: "error", text: response.error || "No pending invitation found for this email."});
        }
      } catch (error) {
        console.error("Error verifying invitation:", error);
        setMessage({type: "error", text: "Failed to verify invitation: " + (error as Error).message});
      } finally {
        setVerificationLoading(false);
      }
    };

    verifyInvitation();
  }, [email]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Verify that the signed-in user's email matches the invitation email
      if (user.email !== email) {
        setMessage({type: "error", text: "Email mismatch. Please sign in with the email you were invited to."});
        // Sign out the user
        await auth.signOut();
        setLoading(false);
        return;
      }
      
      // Complete the invitation process by creating the full user account
      // For OAuth flow, we don't need a real token or password
      const completionData = {
        token: "oauth_" + Date.now(), // OAuth identifier
        email: user.email,
        fullName: user.displayName || user.email.split('@')[0],
        password: "oauth_placeholder_" + Date.now() // Generate a unique placeholder password
      };
      
      const response = await invitationApi.completeInvitation(completionData);
      
      if (response.success || response.uid) {
        setMessage({ type: "success", text: "Account created successfully! Redirecting to dashboard..." });
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setMessage({ type: "error", text: response.error || "Failed to create account. Please try again." });
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // Provide more specific error messages
      let errorMessage = "Failed to sign up with Google. Please try again.";
      if (error instanceof Error && error.message && error.message.includes("Query did not return a unique result")) {
        errorMessage = "Multiple invitations found for this email. Please contact an administrator to resolve this issue.";
      } else if (error instanceof Error && error.message) {
        errorMessage = "Failed to sign up with Google: " + error.message;
      }
      setMessage({type: "error", text: errorMessage});
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const provider = new OAuthProvider('microsoft.com');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Verify that the signed-in user's email matches the invitation email
      if (user.email !== email) {
        setMessage({type: "error", text: "Email mismatch. Please sign in with the email you were invited to."});
        // Sign out the user
        await auth.signOut();
        setLoading(false);
        return;
      }
      
      // Complete the invitation process by creating the full user account
      // For OAuth flow, we don't need a real token or password
      const completionData = {
        token: "oauth_" + Date.now(), // OAuth identifier
        email: user.email,
        fullName: user.displayName || user.email.split('@')[0],
        password: "oauth_placeholder_" + Date.now() // Generate a unique placeholder password
      };
      
      const response = await invitationApi.completeInvitation(completionData);
      
      if (response.success || response.uid) {
        setMessage({ type: "success", text: "Account created successfully! Redirecting to dashboard..." });
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setMessage({ type: "error", text: response.error || "Failed to create account. Please try again." });
      }
    } catch (error) {
      console.error("Error signing in with Microsoft:", error);
      // Provide more specific error messages
      let errorMessage = "Failed to sign up with Microsoft. Please try again.";
      if (error instanceof Error && error.message && error.message.includes("Query did not return a unique result")) {
        errorMessage = "Multiple invitations found for this email. Please contact an administrator to resolve this issue.";
      } else if (error instanceof Error && error.message) {
        errorMessage = "Failed to sign up with Microsoft: " + error.message;
      }
      setMessage({type: "error", text: errorMessage});
    } finally {
      setLoading(false);
    }
  };

  if (verificationLoading) {
    return (
      <div>
        <PageMeta
          title="Sign Up - Admin Dashboard"
          description="Sign up to join the platform"
        />
        <PageBreadcrumb pageTitle="Complete Registration" />
        <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
          <div className="mx-auto flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageMeta
        title="Sign Up - Admin Dashboard"
        description="Sign up to join the platform"
      />
      <PageBreadcrumb pageTitle="Complete Registration" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[630px]">
          <h3 className="mb-6 text-center font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            Complete Your Registration
          </h3>
          
          {message && (
            <div className={`mb-6 rounded-lg px-4 py-3 text-center ${
              message.type === "success" 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
            }`}>
              {message.text}
            </div>
          )}
          
          {invitationData && (
            <div className="mb-6 rounded-lg bg-blue-100 p-4 dark:bg-blue-900">
              <h4 className="mb-2 font-medium text-blue-800 dark:text-blue-100">Invitation Details</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-200">
                <li><strong>Email:</strong> {invitationData.email}</li>
                <li><strong>Role:</strong> {invitationData.role}</li>
                {invitationData.departmentId && <li><strong>Department ID:</strong> {invitationData.departmentId}</li>}
                {invitationData.organization && <li><strong>Organization:</strong> {invitationData.organization}</li>}
              </ul>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-100 p-6 text-center dark:bg-gray-800">
              <h4 className="mb-4 font-medium text-gray-800 dark:text-white">Sign Up with your account</h4>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
                To complete your registration, please sign up with the same email address you were invited to:
                <strong className="ml-1">{email}</strong>
              </p>
              
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign Up with Google
                </button>
                
                <button
                  onClick={handleMicrosoftSignIn}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"
                      fill="#00A4EF"
                    />
                  </svg>
                  Sign Up with Microsoft
                </button>
              </div>
              
              {loading && (
                <div className="mt-4 flex justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                </div>
              )}
            </div>
            
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>By signing up, you agree to our Terms of Service and Privacy Policy.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}