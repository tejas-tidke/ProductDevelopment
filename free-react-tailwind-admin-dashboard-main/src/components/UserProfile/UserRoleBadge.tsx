import { useAuth } from "../../context/AuthContext";

interface UserRoleBadgeProps {
  className?: string;
}

export default function UserRoleBadge({ className = "" }: UserRoleBadgeProps) {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ${className}`}>
        Loading...
      </span>
    );
  }

  if (!userRole) {
    return null;
  }

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        userRole === "SUPER_ADMIN" 
          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100" 
          : userRole === "ADMIN" 
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
          : userRole === "APPROVER" 
          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" 
          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      } ${className}`}
    >
      {userRole}
    </span>
  );
}