import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { PrimaryButton, SecondaryButton } from "../components/ui/button";
import { userService } from "../services/userService";

// Define type for user data
interface UserData {
  role: string;
  user: {
    id: number;
    uid: string;
    email: string;
    name: string;
    role: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export default function UserDataCheck() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchUserDataFromBackend();
    }
  }, [currentUser]);

  const fetchUserDataFromBackend = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user data from backend
      if (currentUser?.uid) {
        const data = await userService.getUserData(currentUser.uid);
        setUserData(data);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to fetch user data from backend");
    } finally {
      setLoading(false);
    }
  };

  const syncUserToBackend = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Sync user data to backend
      if (currentUser?.uid) {
        await userService.syncCurrentUser(
          currentUser.uid,
          currentUser.email || "",
          currentUser.displayName || ""
        );
        
        // Fetch updated data
        fetchUserDataFromBackend();
      }
    } catch (err) {
      console.error("Error syncing user:", err);
      setError("Failed to sync user to backend");
    } finally {
      setLoading(false);
    }
  };

  const syncAllUsersToBackend = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Sync all users to backend
      await userService.syncAllUsers();
      
      // Fetch updated data
      fetchUserDataFromBackend();
    } catch (err) {
      console.error("Error syncing all users:", err);
      setError("Failed to sync all users to backend");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">User Data Check</h1>
        <p>You need to be logged in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Data Check</h1>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-2">Firebase User Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">UID</p>
            <p className="font-mono text-sm break-all">{currentUser.uid}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
            <p>{currentUser.email || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Display Name</p>
            <p>{currentUser.displayName || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Email Verified</p>
            <p>{currentUser.emailVerified ? "Yes" : "No"}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Backend Database Status</h2>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg dark:bg-red-900/20 dark:text-red-300">
            <p>{error}</p>
          </div>
        ) : userData ? (
          <div className="p-4 bg-green-50 rounded-lg dark:bg-green-900/20">
            <p className="text-green-700 dark:text-green-300">User found in database!</p>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Database ID</p>
                <p>{userData.user.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                <p>{userData.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
                <p>{new Date(userData.user.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Updated At</p>
                <p>{new Date(userData.user.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 rounded-lg dark:bg-yellow-900/20">
            <p className="text-yellow-700 dark:text-yellow-300">User not found in database</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <PrimaryButton onClick={fetchUserDataFromBackend} disabled={loading}>
          {loading ? "Checking..." : "Refresh Data"}
        </PrimaryButton>
        <PrimaryButton onClick={syncUserToBackend} disabled={loading}>
          {loading ? "Syncing..." : "Sync Current User"}
        </PrimaryButton>
        <SecondaryButton onClick={syncAllUsersToBackend} disabled={loading}>
          {loading ? "Syncing All..." : "Sync All Users"}
        </SecondaryButton>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
        <h3 className="font-semibold mb-2">How to use this page:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Check if your user data is present in the backend database</li>
          <li>If not found, click "Sync Current User" to add your data to the database</li>
          <li>If you want to sync all Firebase users, click "Sync All Users"</li>
          <li>Click "Refresh Data" to check the current status</li>
        </ul>
      </div>
    </div>
  );
}