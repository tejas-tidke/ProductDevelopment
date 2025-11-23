import React from "react";
import { useNavigate } from "react-router";
import { useNotifications } from "../../context/NotificationContext";

const NotificationDropdown: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      {/* FIX: Proper alignment using inline-block + relative */}
      <details className="relative inline-block">
        <summary className="list-none cursor-pointer flex items-center">
          <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700">
            <span className="text-lg">🔔</span>

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-3 w-3 rounded-full bg-red-500 border border-white" />
            )}
          </span>
        </summary>

        {/* FIX: This now aligns correctly on the right due to parent relative */}
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
              Notifications
            </span>

            <div className="flex gap-2">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] text-gray-500 hover:underline"
                  >
                    Mark all read
                  </button>

                  <button
                    onClick={clearAll}
                    className="text-[10px] text-red-500 hover:underline"
                  >
                    Clear all
                  </button>
                </>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="px-3 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
              No notifications
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`px-3 py-3 text-sm ${
                    n.isRead
                      ? "bg-white dark:bg-gray-800"
                      : "bg-blue-50 dark:bg-blue-900/20"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {n.title}
                      </div>

                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-line">
                        {n.message}
                      </div>

                      <div className="text-[10px] text-gray-400 mt-1">
                        Issue: {n.issueKey} • {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <button
                      onClick={() => {
                        markAsRead(n.id);
                        navigate(`/request-management/${n.issueKey}`);
                      }}
                      className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      View Request
                    </button>

                    {!n.isRead && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-[11px] text-gray-500 hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </div>
  );
};

export default NotificationDropdown;
