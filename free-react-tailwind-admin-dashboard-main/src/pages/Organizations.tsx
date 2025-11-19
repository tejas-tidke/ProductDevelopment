import { useState, useEffect, useCallback } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { organizationApi } from "../services/api";
import { useNavigate } from "react-router";
import { usePermissions } from "../hooks/usePermissions";

// Define Organization type
interface Organization {
  id: number;
  name: string;
  parentId: number | null;
}

export default function Organizations() {
  const navigate = useNavigate();
  const { canManageOrganizations } = usePermissions();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: string, text: string} | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    parentId: ""
  });

  // Create stable versions of the permission check
  const stableCanManageOrganizations = useCallback(canManageOrganizations, []);
  const canManageOrgs = useCallback(() => stableCanManageOrganizations(), [stableCanManageOrganizations]);

  // Check if user has permission to access this page
  useEffect(() => {
    if (!canManageOrgs()) {
      navigate("/");
    }
  }, [canManageOrgs, navigate]);

  // Fetch organizations when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const orgData = await organizationApi.getAllOrganizations();
        setOrganizations(orgData);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        setMessage({type: "error", text: "Failed to load organizations: " + (error as Error).message});
      } finally {
        setLoading(false);
      }
    };

    if (canManageOrgs()) {
      fetchData();
    }
  }, [canManageOrgs]);

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
      if (editingOrg) {
        // Update existing organization
        await organizationApi.updateOrganization(editingOrg.id.toString(), {
          name: formData.name,
          parentId: formData.parentId ? parseInt(formData.parentId) : undefined
        });
        setMessage({ type: "success", text: "Organization updated successfully!" });
      } else {
        // Create new organization
        await organizationApi.createOrganization({
          name: formData.name,
          parentId: formData.parentId ? parseInt(formData.parentId) : undefined
        });
        setMessage({ type: "success", text: "Organization created successfully!" });
      }
      
      // Reset form
      setFormData({
        name: "",
        parentId: ""
      });
      setEditingOrg(null);
      setShowForm(false);
      
      // Refresh organizations list
      const orgData = await organizationApi.getAllOrganizations();
      setOrganizations(orgData);
    } catch (error) {
      console.error("Error saving organization:", error);
      setMessage({type: "error", text: "Failed to save organization: " + (error as Error).message});
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      parentId: org.parentId ? org.parentId.toString() : ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this organization?")) {
      return;
    }
    
    try {
      setLoading(true);
      await organizationApi.deleteOrganization(id.toString());
      setMessage({ type: "success", text: "Organization deleted successfully!" });
      
      // Refresh organizations list
      const orgData = await organizationApi.getAllOrganizations();
      setOrganizations(orgData);
    } catch (error) {
      console.error("Error deleting organization:", error);
      setMessage({type: "error", text: "Failed to delete organization: " + (error as Error).message});
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      parentId: ""
    });
    setEditingOrg(null);
    setShowForm(false);
  };

  // Only show the page to users with appropriate permissions
  if (!canManageOrgs()) {
    return null;
  }

  return (
    <div>
      <PageMeta
        title="Manage Organizations - Admin Dashboard"
        description="Manage organizations in the platform"
      />
      <PageBreadcrumb pageTitle="Manage Organizations" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <h3 className="text-center font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
              Manage Organizations
            </h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              {showForm ? "Cancel" : "Add Organization"}
            </button>
          </div>
          
          {message && (
            <div className={`mb-6 rounded-lg px-4 py-3 text-center ${
              message.type === "success" 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
            }`}>
              {message.text}
            </div>
          )}
          
          {/* Organization Form */}
          {showForm && (
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                {editingOrg ? "Edit Organization" : "Create New Organization"}
              </h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
                    placeholder="Enter organization name"
                  />
                </div>
                
                <div>
                  <label htmlFor="parentId" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Parent Organization
                  </label>
                  <select
                    id="parentId"
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
                  >
                    <option value="">None (Top-level organization)</option>
                    {organizations
                      .filter(org => !editingOrg || org.id !== editingOrg.id) // Prevent self-reference
                      .map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  >
                    {loading ? "Saving..." : (editingOrg ? "Update" : "Create")}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Organizations List */}
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Parent Organization
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center">
                        Loading organizations...
                      </td>
                    </tr>
                  ) : organizations.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center">
                        No organizations found.
                      </td>
                    </tr>
                  ) : (
                    organizations.map((org) => (
                      <tr 
                        key={org.id} 
                        className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {org.name}
                        </td>
                        <td className="px-6 py-4">
                          {org.parentId ? 
                            organizations.find(o => o.id === org.parentId)?.name || "Unknown" : 
                            "None (Top-level)"
                          }
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(org)}
                              className="font-medium text-blue-600 hover:underline dark:text-blue-500"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(org.id)}
                              className="font-medium text-red-600 hover:underline dark:text-red-500"
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}