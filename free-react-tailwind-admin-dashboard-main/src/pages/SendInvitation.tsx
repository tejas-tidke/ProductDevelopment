import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { invitationApi, departmentApi } from "../services/api";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

// Define Department type
interface Department {
  id: number;
  name: string;
}

export default function SendInvitation() {
  const navigate = useNavigate();
  const { userRole, isSuperAdmin } = useAuth();
  
  const [formData, setFormData] = useState({
    email: "",
    role: "REQUESTER",
    departmentId: "", // Add departmentId to form data
    organization: "" // Only for SUPER_ADMIN
  });
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: string, text: string} | null>(null);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);

  // Fetch departments when component mounts
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const deptData = await departmentApi.getAllDepartments();
        setDepartments(deptData);
      } catch (error) {
        console.error("Error fetching departments:", error);
        setMessage({type: "error", text: "Failed to load departments: " + (error as Error).message});
      }
    };

    fetchDepartments();
  }, []);

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
    setInvitationLink(null);
    
    try {
      // Prepare invitation data
      const invitationData: any = {
        email: formData.email,
        role: formData.role,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null
      };
      
      // Only SUPER_ADMIN can set organization
      if (isSuperAdmin && formData.organization) {
        invitationData.organization = formData.organization;
      }
      
      const response = await invitationApi.createInvitation(invitationData);
      
      if (response.invitationLink) {
        setInvitationLink(response.invitationLink);
        setMessage({ type: "success", text: "Invitation sent successfully! The user will receive an email with the invitation link." });
      } else {
        setMessage({ type: "success", text: "Invitation created successfully!" });
      }

      // Reset form (but keep department selection)
      setFormData(prev => ({
        ...prev,
        email: "",
        role: "REQUESTER",
        organization: isSuperAdmin ? prev.organization : ""
      }));
    } catch (error) {
      console.error("Error sending invitation:", error);
      setMessage({type: "error", text: "Failed to send invitation: " + (error as Error).message});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageMeta
        title="Send Invitation - Admin Dashboard"
        description="Send invitations to new users"
      />
      <PageBreadcrumb pageTitle="Send Invitation" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[630px]">
          <h3 className="mb-6 text-center font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            Send Invitation
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
          
          {invitationLink && (
            <div className="mb-6 rounded-lg bg-blue-100 p-4 dark:bg-blue-900">
              <h4 className="mb-2 font-medium text-blue-800 dark:text-blue-100">Invitation Link</h4>
              <p className="mb-3 text-sm text-blue-700 dark:text-blue-200">
                Copy and share this link with the invited user:
              </p>
              <div className="flex items-center">
                <input
                  type="text"
                  readOnly
                  value={invitationLink}
                  className="flex-1 rounded-l-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(invitationLink)}
                  className="rounded-r-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
          
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
                Role *
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
                {userRole === "SUPER_ADMIN" && (
                  <>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </>
                )}
              </select>
            </div>
            
            {/* Department Selection */}
            <div>
              <label htmlFor="departmentId" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Department
              </label>
              <select
                id="departmentId"
                name="departmentId"
                value={formData.departmentId}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Organization (only for SUPER_ADMIN) */}
            {isSuperAdmin && (
              <div>
                <label htmlFor="organization" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Organization *
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
                  placeholder="Enter organization name"
                />
              </div>
            )}
            
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                {loading ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}