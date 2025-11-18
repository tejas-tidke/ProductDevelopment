import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { invitationApi } from "../services/api";
import { useNavigate, useLocation } from "react-router";

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
  
  // Extract token and email from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token") || "";
  const email = queryParams.get("email") || "";
  
  const [formData, setFormData] = useState({
    fullName: "",
    password: "",
    confirmPassword: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: string, text: string} | null>(null);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(true);

  // Verify the invitation when component mounts
  useEffect(() => {
    const verifyInvitation = async () => {
      if (!token || !email) {
        setMessage({type: "error", text: "Invalid invitation link. Token and email are required."});
        setVerificationLoading(false);
        return;
      }
      
      try {
        const response = await invitationApi.verifyInvitation(token, email);
        if (response.valid) {
          setInvitationData(response);
          setMessage({type: "success", text: "Invitation verified successfully. Please complete your registration."});
        } else {
          setMessage({type: "error", text: response.error || "Invalid or expired invitation."});
        }
      } catch (error) {
        console.error("Error verifying invitation:", error);
        setMessage({type: "error", text: "Failed to verify invitation: " + (error as Error).message});
      } finally {
        setVerificationLoading(false);
      }
    };

    verifyInvitation();
  }, [token, email]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setMessage({type: "error", text: "Passwords do not match."});
      return;
    }
    
    if (formData.password.length < 6) {
      setMessage({type: "error", text: "Password must be at least 6 characters long."});
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      // Prepare completion data
      const completionData = {
        token,
        email,
        fullName: formData.fullName,
        password: formData.password
      };
      
      const response = await invitationApi.completeInvitation(completionData);
      
      if (response.uid) {
        setMessage({ type: "success", text: "Registration completed successfully! You can now sign in with your email and password." });
        
        // Redirect to sign in page after a short delay
        setTimeout(() => {
          navigate("/signin");
        }, 3000);
      } else {
        setMessage({ type: "error", text: "Registration failed. Please try again." });
      }
    } catch (error) {
      console.error("Error completing invitation:", error);
      setMessage({type: "error", text: "Failed to complete registration: " + (error as Error).message});
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
                {invitationData.organization && <li><strong>Organization:</strong> {invitationData.organization}</li>}
              </ul>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
                placeholder="Enter password (min. 6 characters)"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
                placeholder="Confirm your password"
              />
            </div>
            
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                {loading ? "Completing..." : "Complete Registration"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}