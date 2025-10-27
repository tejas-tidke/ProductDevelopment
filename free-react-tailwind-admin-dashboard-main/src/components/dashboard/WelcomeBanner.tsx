import { useAuth } from "../../context/AuthContext";
import UserRoleBadge from "../UserProfile/UserRoleBadge";

export default function WelcomeBanner() {
  const { currentUser } = useAuth();
  
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 sm:text-2xl">
            Welcome back, {currentUser?.displayName || "User"}!
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Here's what's happening with your account today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">Your role:</span>
          <UserRoleBadge />
        </div>
      </div>
    </div>
  );
}