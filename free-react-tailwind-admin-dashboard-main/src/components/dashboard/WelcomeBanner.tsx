import { useAuth } from "../../context/AuthContext";
// import UserRoleBadge from "../UserProfile/UserRoleBadge";

export default function WelcomeBanner() {
  const { currentUser } = useAuth();

  return (
    <div className="rounded-2xl border border-[#A89FE0] bg-gradient-to-b from-[#C8C3EA] to-[#74D1CF] p-5 dark:border-[#6d6799] dark:bg-gradient-to-b dark:from-[#8f89c9] dark:to-[#4ba9a7] text-[#F5F7FF] lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-black dark:text-black sm:text-2xl">
            Welcome back, {currentUser?.displayName || "User"}!
          </h2>
          <p className="mt-1 text-sm text-[#F5F7FF] dark:text-gray-400">
            Here's what's happening with your account today.
          </p>
        </div>
        {/* <div className="flex items-center gap-3">
          <span className="text-sm text-[#F5F7FF] dark:text-gray-400">Your role:</span>
          <UserRoleBadge />
        </div> */}
      </div>
    </div>
  );
}
