import { useState, useEffect } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { userApi } from "../services/api";
import { Dropdown } from "../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../components/ui/dropdown/DropdownItem";

interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  avatar?: string;
}

interface UserData {
  id?: number;
  uid?: string;
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
  avatar?: string;
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userApi.getAllUsers();
      console.log("Fetched users data:", data);
      
      // Transform the data to match our User interface
      const transformedUsers = data.map((user: UserData) => ({
        id: user.id?.toString() || "",
        uid: user.uid || "",
        name: user.name || "Unknown",
        email: user.email || "No email",
        role: user.role || "USER",
        active: user.active !== undefined ? user.active : true,
        avatar: user.avatar || "/images/user/user-01.jpg"
      }));
      
      setUsers(transformedUsers);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (userId: string) => {
    setDropdownOpen(dropdownOpen === userId ? null : userId);
  };

  const closeDropdown = () => {
    setDropdownOpen(null);
  };

  const handleDisableUser = async (userId: string) => {
    try {
      // Call the API to disable the user
      await userApi.disableUser(userId);
      // Update the UI
      setUsers(users.map(user => 
        user.id === userId ? { ...user, active: false } : user
      ));
      closeDropdown();
    } catch (err) {
      setError("Failed to disable user: " + (err as Error).message);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      // Call the API to activate the user
      await userApi.enableUser(userId);
      // Update the UI
      setUsers(users.map(user => 
        user.id === userId ? { ...user, active: true } : user
      ));
      closeDropdown();
    } catch (err) {
      setError("Failed to activate user: " + (err as Error).message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Call the API to delete the user
      await userApi.deleteUser(userId);
      // Update the UI
      setUsers(users.filter(user => user.id !== userId));
      closeDropdown();
    } catch (err) {
      setError("Failed to delete user: " + (err as Error).message);
    }
  };

  return (
    <div>
      <PageMeta
        title="Users List - Admin Dashboard"
        description="View and manage all users in the system"
      />
      <PageBreadcrumb pageTitle="Users List" />
      
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] xl:p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Users Management
          </h3>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-red-800 dark:bg-red-900 dark:text-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="mr-3 h-10 w-10 overflow-hidden rounded-full">
                          <img
                            src={user.avatar || "/images/user/user-01.jpg"}
                            alt={user.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        user.role === "ADMIN"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        user.active
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                      }`}>
                        {user.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => toggleDropdown(user.id)}
                          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                          aria-label="User actions"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        <Dropdown
                          isOpen={dropdownOpen === user.id}
                          onClose={closeDropdown}
                          className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-2xl border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-800 dark:bg-gray-900"
                        >
                          <ul>
                            {user.active ? (
                              <li>
                                <DropdownItem
                                  onItemClick={() => handleDisableUser(user.id)}
                                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                  Disable User
                                </DropdownItem>
                              </li>
                            ) : (
                              <li>
                                <DropdownItem
                                  onItemClick={() => handleActivateUser(user.id)}
                                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                >
                                  Activate User
                                </DropdownItem>
                              </li>
                            )}
                            <li>
                              <DropdownItem
                                onItemClick={() => handleDeleteUser(user.id)}
                                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-800"
                              >
                                Delete User
                              </DropdownItem>
                            </li>
                          </ul>
                        </Dropdown>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {users.length === 0 && !loading && (
              <div className="py-12 text-center">
                <div className="mx-auto h-16 w-16 text-gray-400">
                  <svg
                    className="h-16 w-16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    ></path>
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No users found
                </h3>
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                  There are no users in the system yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}