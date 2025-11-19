import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { invitationApi } from "../services/api";
import { useNavigate, useLocation } from "react-router";
import { signInWithPopup, GoogleAuthProvider, OAuthProvider, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";

// Define interface for invitation data
interface InvitationData {
  email: string;
  role: string;
  departmentId?: number;
  organizationId?: number;
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
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFormData, setCustomFormData] = useState({
    fullName: "",
    password: ""
  });

  // Verify the invitation when component mounts
  useEffect(() => {
    const verifyInvitation = async () => {
      if (!email) {
        setMessage({type: "error", text: "Invalid invitation. Email is required."});
        setVerificationLoading(false);
        return;
      }

      try {
        // Verify invitation by email only (for OAuth flow)
        const response = await invitationApi.verifyInvitationByEmail(email);
        
        if (response.valid) {
          setInvitationData({
            email: response.email,
            role: response.role,
            departmentId: response.departmentId,
            organizationId: response.organizationId
          });
          setMessage(null);
        } else {
          setMessage({type: "error", text: response.error || "Invalid invitation."});
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

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // After successful sign-in, complete the invitation
      await completeInvitation(result.user.displayName || result.user.email || "");
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setMessage({type: "error", text: "Failed to sign in with Google: " + (error as Error).message});
      setLoading(false);
    }
  };

  // Handle Microsoft sign-in
  const handleMicrosoftSignIn = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const provider = new OAuthProvider('microsoft.com');
      const result = await signInWithPopup(auth, provider);
      
      // After successful sign-in, complete the invitation
      await completeInvitation(result.user.displayName || result.user.email || "");
    } catch (error) {
      console.error("Error signing in with Microsoft:", error);
      setMessage({type: "error", text: "Failed to sign in with Microsoft: " + (error as Error).message});
      setLoading(false);
    }
  };

  // Handle custom email/password registration
  const handleCustomRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationData || !customFormData.fullName || !customFormData.password) {
      setMessage({type: "error", text: "Please fill in all required fields."});
      return;
    }
    
    if (customFormData.password.length < 6) {
      setMessage({type: "error", text: "Password must be at least 6 characters long."});
      return;
    }
    
    // Additional password strength validation (non-blocking warning)
    if (customFormData.password.length < 8) {
      console.warn("Password is less than 8 characters. Consider using a stronger password.");
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, invitationData.email, customFormData.password);
      
      // Update user profile with full name
      await updateProfile(userCredential.user, {
        displayName: customFormData.fullName
      });
      
      // Complete the invitation process
      await completeInvitation(customFormData.fullName);
    } catch (error) {
      console.error("Error creating account:", error);
      
      // Handle specific Firebase errors
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'auth/email-already-in-use') {
        setMessage({
          type: "error", 
          text: "An account with this email already exists. Please try signing in with Google or Microsoft, or use a different email."
        });
      } else if (firebaseError.code === 'auth/invalid-email') {
        setMessage({
          type: "error", 
          text: "The email address is invalid. Please check and try again."
        });
      } else if (firebaseError.code === 'auth/weak-password') {
        setMessage({
          type: "error", 
          text: "The password is too weak. Please use a stronger password."
        });
      } else {
        setMessage({
          type: "error", 
          text: "Failed to create account: " + (firebaseError.message || (error as Error).message || "Unknown error occurred")
        });
      }
      
      setLoading(false);
    }
  };
  
  // Handle input changes for custom form
  const handleCustomFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Complete the invitation process
  const completeInvitation = async (fullName: string) => {
    if (!invitationData) {
      setMessage({type: "error", text: "Invitation data not found."});
      setLoading(false);
      return;
    }

    try {
      // For OAuth flow, we don't have a token, so we'll pass a placeholder
      const completionData = {
        token: "oauth_placeholder",
        email: invitationData.email,
        fullName: fullName,
        password: "oauth_password" // Placeholder - not used for OAuth
      };

      const response = await invitationApi.completeInvitation(completionData);
      
      if (response.message) {
        setMessage({type: "success", text: response.message});
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (error) {
      console.error("Error completing invitation:", error);
      setMessage({type: "error", text: "Failed to complete invitation: " + (error as Error).message});
    } finally {
      setLoading(false);
    }
  };

  if (verificationLoading) {
    return (
      <div>
        <PageMeta
          title="Complete Invitation - Admin Dashboard"
          description="Complete your invitation to join the platform"
        />
        <PageBreadcrumb pageTitle="Complete Invitation" />
        <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
          <div className="mx-auto w-full max-w-[630px]">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageMeta
        title="Complete Invitation - Admin Dashboard"
        description="Complete your invitation to join the platform"
      />
      <PageBreadcrumb pageTitle="Complete Invitation" />
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
                {invitationData.organizationId && <li><strong>Organization ID:</strong> {invitationData.organizationId}</li>}
              </ul>
            </div>
          )}
          
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
                </svg>
                Sign in with Google
              </button>
              
              <button
                onClick={handleMicrosoftSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#F35325" d="M1 1h10v10H1z"></path>
                  <path fill="#81BC06" d="M1 13h10v10H1z"></path>
                  <path fill="#05A6F0" d="M13 1h10v10H13z"></path>
                  <path fill="#FFBA08" d="M13 13h10v10H13z"></path>
                </svg>
                Sign in with Microsoft
              </button>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={() => setShowCustomForm(!showCustomForm)}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
              >
                Create Account with Email
              </button>
              
              {showCustomForm && (
                <form onSubmit={handleCustomRegistration} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={customFormData.fullName}
                      onChange={handleCustomFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={customFormData.password}
                      onChange={handleCustomFormChange}
                      required
                      minLength={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      placeholder="Create a password (min. 6 characters)"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>
                </form>
              )}
            </div>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}