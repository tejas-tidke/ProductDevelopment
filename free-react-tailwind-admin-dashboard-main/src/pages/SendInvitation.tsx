import { useState, useEffect, useCallback } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { invitationApi, departmentApi, organizationApi } from "../services/api";
import { useNavigate } from "react-router";
import { usePermissions } from "../hooks/usePermissions";
import { useAuth } from "../context/AuthContext";

// Define Department type
interface Department {
  id: number;
  name: string;
}

// Define Organization type
interface Organization {
  id: number;
  name: string;
  parentId: number | null;
}

export default function SendInvitation() {
  const navigate = useNavigate();
  const { userRole, hasRole, canSendInvitations } = usePermissions();
  const { userDepartmentId, userOrganizationId } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    role: "REQUESTER",
    departmentId: "", // Add departmentId to form data
    organizationId: "" // Only for SUPER_ADMIN
  });
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: string, text: string} | null>(null);

  // Create stable versions of the permission checks
  const stableCanSendInvitations = useCallback(canSendInvitations, []);
  const stableHasRole = useCallback(hasRole, []);
  const canSendInvite = useCallback(() => stableCanSendInvitations(), [stableCanSendInvitations]);
  const isSuperAdminMemo = useCallback(() => stableHasRole('SUPER_ADMIN'), [stableHasRole]);

  // Check if user has permission to access this page
  useEffect(() => {
    if (!canSendInvite()) {
      navigate("/");
    }
  }, [canSendInvite, navigate]);

  // Fetch departments and organizations when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const deptData = await departmentApi.getAllDepartments();
        setDepartments(deptData);
        
        // Auto-select the current user's department for Admin users
        if (userDepartmentId && !hasRole('SUPER_ADMIN')) {
          setFormData(prev => ({
            ...prev,
            departmentId: userDepartmentId.toString()
          }));
        }
        
        if (hasRole('SUPER_ADMIN')) {
          const orgData = await organizationApi.getAllOrganizations();
          setOrganizations(orgData);
          
          // Auto-select the current user's organization for SUPER_ADMIN
          if (userOrganizationId) {
            setFormData(prev => ({
              ...prev,
              organizationId: userOrganizationId.toString()
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setMessage({type: "error", text: "Failed to load data: " + (error as Error).message});
      }
    };

    if (canSendInvite()) {
      fetchData();
    }
  }, [canSendInvite, hasRole, userDepartmentId, userOrganizationId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      // Prepare invitation data for pending user creation
      const invitationData: {
        email: string;
        role: string;
        departmentId: number | null;
        organizationId?: number;
      } = {
        email: formData.email,
        role: formData.role,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null
      };
      
      // Add organizationId if provided
      if (formData.organizationId) {
        invitationData.organizationId = parseInt(formData.organizationId);
      } else if (!hasRole('SUPER_ADMIN') && userOrganizationId) {
        // For non-SUPER_ADMIN users, add organizationId if available
        invitationData.organizationId = userOrganizationId;
      }
      
      // Create pending user record instead of sending token
      const response = await invitationApi.createInvitation(invitationData);
      
      if (response.success) {
        setMessage({ type: "success", text: "Invitation sent successfully! The user will receive an email notification with instructions to sign up using their Google or Microsoft account." });
      } else {
        setMessage({ type: "success", text: "User invited successfully! They will receive an email notification." });
      }

      // Reset form (but keep department selection for Admin users)
      setFormData(prev => ({
        ...prev,
        email: "",
        role: "REQUESTER",
        departmentId: hasRole('SUPER_ADMIN') ? "" : (userDepartmentId ? userDepartmentId.toString() : ""),
        organizationId: hasRole('SUPER_ADMIN') ? (userOrganizationId ? userOrganizationId.toString() : "") : ""
      }));
    } catch (error) {
      console.error("Error sending invitation:", error);
      setMessage({type: "error", text: "Failed to send invitation: " + (error as Error).message});
    } finally {
      setLoading(false);
    }
  };

  // Only show the page to users with SEND_INVITATIONS permission
  if (!canSendInvite()) {
    return null;
  }

  return (
    <div>
      <PageMeta
        title="Invite User - Admin Dashboard"
        description="Invite new users to join the platform"
      />
      <PageBreadcrumb pageTitle="Invite User" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[630px]">
          <h3 className="mb-6 text-center font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            Invite New User
          </h3>
          {userRole === "SUPER_ADMIN" && (
            <div className="mb-4 rounded-md bg-yellow-100 p-2 text-center text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              SUPER ADMIN: You can assign users.
              </div>
          )}
          
          {message && (
            <div className={`mb-6 rounded-lg px-4 py-3 text-center ${
              message.type === "success" 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
            }`}>
              {message.text}
            </div>
          )}
          
          {/* <div className="mb-6 rounded-lg bg-blue-100 p-4 dark:bg-blue-900">
            <h4 className="mb-2 font-medium text-blue-800 dark:text-blue-100">Security Notice</h4>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              Invite new users to sign up using their Google or Microsoft account. 
              They will receive an email notification and must use the same email address to complete registration.
            </p>
            {userRole === "SUPER_ADMIN" && (
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-200">
                <strong>Note:</strong> As a SUPER_ADMIN, you can assign users to specific organizations.
              </p>
            )}
          </div> */}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
                placeholder="Enter email address"
              />
            </div>
            
            <div>
              <label htmlFor="role" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Role * {userRole === "SUPER_ADMIN" && <span className="text-xs text-yellow-600 dark:text-yellow-400">(SUPER_ADMIN)</span>}
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
              >
                <option value="REQUESTER">Requester</option>
                <option value="APPROVER">Approver</option>
                {userRole === "SUPER_ADMIN" ? (
                  <>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </>
                ) : (
                  <option value="ADMIN" disabled>
                    Admin (SUPER_ADMIN only)
                  </option>
                )}
              </select>
              {userRole !== "SUPER_ADMIN" && (
                <p className="mt-1 text-xs text-gray-500">Higher roles available to SUPER_ADMIN users only.</p>
              )}
            </div>
            
            {/* Department Selection */}
            <div>
              <label htmlFor="departmentId" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Department * {hasRole('SUPER_ADMIN') ? "" : "(Auto-selected based on your department)"}
              </label>
              <select
                id="departmentId"
                name="departmentId"
                value={formData.departmentId}
                onChange={handleInputChange}
                required
                disabled={!hasRole('SUPER_ADMIN')} // Disable for non-SUPER_ADMIN users
                className={`w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900 ${!hasRole('SUPER_ADMIN') ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {!hasRole('SUPER_ADMIN') ? (
                <p className="mt-1 text-xs text-gray-500">Department is auto-selected based on your login credentials.</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">Select the department the user will belong to.</p>
              )}
            </div>
            
            {/* Organization Selection - Only visible to SUPER_ADMIN */}
            {isSuperAdminMemo() && (
              <div>
                <label htmlFor="organizationId" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Organization <span className="text-xs text-gray-500">(SUPER_ADMIN only)</span>
                </label>
                <select
                  id="organizationId"
                  name="organizationId"
                  value={formData.organizationId}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
                >
                  <option value="">Select Organization (Optional)</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Assign user to a specific organization. If empty, user will be assigned to 'Cost Room'.</p>
              </div>
            )}
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                {loading ? "Sending Invitation..." : "Send Invitation"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}