import { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { userApi } from "../services/api";
import { useNavigate } from "react-router";


export default function Blank() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER"
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: string, text: string} | null>(null);

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
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };
      
      await userApi.createFirebaseUser(userData);
      setMessage({ type: "success", text: "User created successfully!" });

      // Redirect to user management after a short delay
      setTimeout(() => {
        navigate("/users"); // <-- change this path to match your actual route
      }, 1500);
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "USER"
      });
    } catch (error) {
      console.error("Error creating user:", error);
      setMessage({type: "error", text: "Failed to create user: " + (error as Error).message});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageMeta
        title="Create User - Admin Dashboard"
        description="Create new users in the system"
      />
      <PageBreadcrumb pageTitle="Create New User" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[630px]">
          <h3 className="mb-6 text-center font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            Create New User
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
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
                placeholder="Enter full name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
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
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
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
              <label htmlFor="role" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}