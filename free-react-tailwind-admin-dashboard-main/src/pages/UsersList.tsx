import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { userApi, departmentApi, organizationApi } from "../services/api";
import { Dropdown } from "../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../components/ui/dropdown/DropdownItem";
import { useAuth } from "../context/AuthContext";

interface Department {
  id: number;
  name: string;
}

interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  avatar?: string;
  organization?: string | null;
  department?: {
    id?: number;
    name?: string;
  } | null;
  departmentId?: number | null;
}

interface UserData {
  id?: number;
  uid?: string;
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
  avatar?: string;
  organization?: string | null;
  department?: { id?: number; name?: string } | null;
  departmentId?: number | null;
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [organizations, setOrganizations] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("All");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  const [selectedOrganization, setSelectedOrganization] = useState<string>("All");
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin, userDepartmentId, userOrganizationId, userOrganizationName } = useAuth();
  
  // Debug logging
  useEffect(() => {
    console.log("Auth context values:", { isSuperAdmin, isAdmin, userDepartmentId, userOrganizationId, userOrganizationName });
  }, [isSuperAdmin, isAdmin, userDepartmentId, userOrganizationId, userOrganizationName]);

  // static suggestions (IDs 1..4)
  const staticSuggestions: Department[] = [
    { id: 1, name: "Finance" },
    { id: 2, name: "Technology" },
    { id: 3, name: "HR" },
    { id: 4, name: "Sales" },
  ];

  useEffect(() => {
    // Only fetch data when we have the necessary auth context values
    if (isSuperAdmin !== undefined && isAdmin !== undefined) {
      fetchUsersAndDepartments();
    }
  }, [isSuperAdmin, isAdmin, userDepartmentId, userOrganizationId, userOrganizationName]);

  const fetchUsersAndDepartments = async () => {
    try {
      setLoading(true);
      setError(null);

      // For Admin users, fetch only users from their organization and department
      // For Super Admin, fetch all users
      let usersData;
      if (isAdmin && !isSuperAdmin) {
        // Check if user has organization and department assigned
        console.log("Fetching users for Admin with orgId:", userOrganizationId, "deptId:", userDepartmentId);
        
        // For Admin users, we need both organization and department to be assigned
        if (userOrganizationId !== null && userDepartmentId !== null) {
          usersData = await userApi.getUsersByOrganizationAndDepartment(userOrganizationId, userDepartmentId);
        } else {
          // If admin doesn't have department or organization assigned, show empty list with message
          usersData = [];
        }
      } else {
        console.log("Fetching all users for Super Admin or non-Admin");
        usersData = await userApi.getAllUsers();
      }

      console.log("Users data fetched:", usersData);

      const [deptsData, orgsData] = await Promise.all([
        departmentApi.getAllDepartments(),
        organizationApi.getAllOrganizations(),
      ]);

      // Normalize departments from backend
      const fetchedDepts: Department[] = Array.isArray(deptsData)
        ? deptsData.map((d: { id: unknown; name: unknown }) => ({ id: Number(d.id), name: String(d.name) }))
        : [];

      // merge static suggestions + fetched departments, avoid duplicate ids
      const mergedMap = new Map<number, Department>();
      staticSuggestions.forEach((d) => mergedMap.set(d.id, d));
      fetchedDepts.forEach((d) => mergedMap.set(d.id, d));
      const mergedDepartments = Array.from(mergedMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setDepartments(mergedDepartments);

      // Normalize organizations from backend
      const fetchedOrgs = Array.isArray(orgsData)
        ? orgsData.map((o: { id: unknown; name: unknown }) => ({ id: Number(o.id), name: String(o.name) }))
        : [];
      setOrganizations(fetchedOrgs);

      // build id->name map for quick lookup
      const deptNameLookup = new Map<number, string>();
      mergedDepartments.forEach((d) => deptNameLookup.set(d.id, d.name));

      // transform users (ensure organization gets copied if present)
      const transformedUsers: User[] = (usersData as UserData[]).map((u) => {
        const deptId =
          (u.department && (u.department.id as number | undefined)) ??
          (u.departmentId !== undefined ? u.departmentId : undefined);

        const deptObj = deptId ? { id: Number(deptId), name: deptNameLookup.get(Number(deptId)) || u.department?.name } : u.department ?? null;
        
        // Extract organization name from nested object
        let organizationName = null;
        if (u.organization) {
          if (typeof u.organization === 'string') {
            organizationName = u.organization;
          } else if (typeof u.organization === 'object' && u.organization !== null) {
            organizationName = (u.organization as { name?: string }).name || null;
          }
        }

        return {
          id: u.id?.toString() || "",
          uid: u.uid || "",
          name: u.name || "Unknown",
          email: u.email || "No email",
          role: u.role || "REQUESTER",
          active: u.active !== undefined ? u.active : true,
          avatar: u.avatar || "/images/user/user-01.jpg",
          organization: organizationName,
          department: deptObj ?? null,
          departmentId: u.departmentId ?? null,
        };
      });

      console.log("Transformed users:", transformedUsers);
      setUsers(transformedUsers);
    } catch (err) {
      console.error("Error fetching users, departments or organizations:", err);
      setError("Failed to fetch users, departments or organizations: " + ((err as Error).message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  // department options for the filter dropdown (starts with "All")
  const departmentOptions = useMemo(() => ["All", ...departments.map((d) => d.name)], [departments]);

  const filteredUsers = users.filter((user) => {
    // For Admin users, filter to show only users from their organization and department
    if (isAdmin && !isSuperAdmin) {
      // Debug logging
      console.log("Admin filtering - User:", user.name, "Role:", user.role, "Org:", user.organization, "Dept:", user.department);
      console.log("Admin context - OrgId:", userOrganizationId, "OrgName:", userOrganizationName, "DeptId:", userDepartmentId);
      
      // Additional client-side filtering as a safety measure
      // For Admin users, we should only show users from their own organization and department
      // Since the API should already filter this, this is just a safety check
      
      // If the admin has organization and department assigned, only show users with matching values
      if (userOrganizationId !== null && userDepartmentId !== null && userOrganizationName !== null) {
        // Check if user's organization and department match admin's
        let userOrgMatch = false;
        if (user.organization) {
          if (typeof user.organization === 'string') {
            userOrgMatch = user.organization === userOrganizationName;
          } else if (typeof user.organization === 'object' && user.organization !== null) {
            userOrgMatch = (user.organization as { name?: string }).name === userOrganizationName;
          }
        }
        
        let userDeptMatch = false;
        if (user.department && typeof user.department === 'object' && user.department !== null) {
          userDeptMatch = user.department.id === userDepartmentId;
        }
        
        console.log("User org match:", userOrgMatch, "User dept match:", userDeptMatch);
        return userOrgMatch && userDeptMatch;
      }
      
      // If admin doesn't have proper assignment, show no users
      console.log("Admin not properly assigned, showing no users");
      return false;
    }
    
    // For Super Admin, apply UI filters
    if (isSuperAdmin) {
      const roleMatch = selectedRole === "All" || user.role === selectedRole;
      const departmentMatch = selectedDepartment === "All" || (user.department && typeof user.department === 'object' && user.department !== null ? user.department.name : user.department) === selectedDepartment;
      const organizationMatch = selectedOrganization === "All" || user.organization === selectedOrganization;
      return roleMatch && departmentMatch && organizationMatch;
    }
    
    // For other users, show all fetched users
    return true;
  });

  const toggleDropdown = (userId: string) => {
    setDropdownOpen((prev) => (prev === userId ? null : userId));
  };

  const closeDropdown = () => setDropdownOpen(null);

  const handleDisableUser = async (userId: string) => {
    try {
      await userApi.disableUser(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, active: false } : u)));
      closeDropdown();
    } catch (err) {
      setError("Failed to disable user: " + ((err as Error).message || String(err)));
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await userApi.enableUser(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, active: true } : u)));
      closeDropdown();
    } catch (err) {
      setError("Failed to activate user: " + ((err as Error).message || String(err)));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await userApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      closeDropdown();
    } catch (err) {
      setError("Failed to delete user: " + ((err as Error).message || String(err)));
    }
  };

  return (
    <div>
      <PageMeta title="Users List - Admin Dashboard" description="View and manage all users in the system" />
      <PageBreadcrumb pageTitle="Users List" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] xl:p-6">
        <div className="mb-6 flex flex-row justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">Users Management</h3>
            <button
              onClick={() => navigate('/send-invitation')}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create New User
            </button>
          </div>

          {/* Show filter options only to Super Admin */}
          {isSuperAdmin && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4">
                <label htmlFor="role-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Role:
                </label>
                <select
                  id="role-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="All">All</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="APPROVER">Approver</option>
                  <option value="REQUESTER">Requester</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label htmlFor="department-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Department:
                </label>
                <select
                  id="department-select"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  {departmentOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label htmlFor="organization-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Organization:
                </label>
                <select
                  id="organization-select"
                  value={selectedOrganization}
                  onChange={(e) => setSelectedOrganization(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="All">All</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.name}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {/* Show simplified info for Admin users */}
          {isAdmin && !isSuperAdmin && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing users from your organization and department
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-red-800 dark:bg-red-900 dark:text-red-100">{error}</div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
            {/* Show message for Admin users without department or organization assignment */}
            {isAdmin && !isSuperAdmin && (userDepartmentId === null || userOrganizationId === null) && (
              <div className="rounded-lg bg-yellow-100 p-4 text-center text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                <p>
                  {userDepartmentId === null 
                    ? "You are not assigned to a department. Please contact your Super Admin." 
                    : "You are not assigned to an organization. Please contact your Super Admin."}
                </p>
              </div>
            )}
            
            {/* For properly assigned Admin users or Super Admin, show the table or appropriate messages */}
            {((isSuperAdmin) || (isAdmin && !isSuperAdmin && userDepartmentId !== null && userOrganizationId !== null)) && (
              <>
                {/* Show message when no users found */}
                {filteredUsers.length === 0 ? (
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
                      {isSuperAdmin 
                        ? "There are no users in the system yet." 
                        : "There are no users in your organization and department."}
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">User</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Role</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Organization</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Department</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {filteredUsers.map((user) => (
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
                              user.role === "SUPER_ADMIN"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
                                : user.role === "ADMIN"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : user.role === "APPROVER"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                            {user.organization || "No Organization"}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                            {user.department ? (typeof user.department === 'object' && user.department !== null ? user.department.name : user.department) : "No Department"}
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
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
