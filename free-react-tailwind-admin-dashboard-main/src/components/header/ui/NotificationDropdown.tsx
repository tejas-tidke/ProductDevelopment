import React, { useState, useRef, useEffect } from "react";
import { useNotifications } from "../../../context/NotificationContext";
import { AppNotification } from "../../../context/NotificationContext";

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotifications();
    
  console.log("NotificationDropdown - notifications:", notifications);
  console.log("NotificationDropdown - unreadCount:", unreadCount);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    await clearAll();
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    console.log("Notification clicked:", notification);
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={toggleDropdown}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
      >
        {/* unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {unreadCount}
          </span>
        )}

        {/* 🔔 icon */}
        <span className="text-lg leading-none">🔔</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 origin-top-right rounded-md bg-white shadow-lg dark:bg-gray-800 dark:shadow-gray-700 z-50">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h5 className="text-lg font-bold text-dark dark:text-white">
                Notification
              </h5>
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm font-medium text-primary hover:text-primary-hover"
              >
                Mark all as read
              </button>
            </div>
          </div>

          <ul className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-5 py-3 text-center text-gray-500 dark:text-gray-400">
                No notifications
              </li>
            ) : (
              notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex w-full items-center border-t border-gray-200 px-5 py-3 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 ${
                      !notification.isRead
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    <div className="mr-3 flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                      <svg
                        className="fill-blue-500 dark:fill-blue-400"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 0C4.486 0 0 4.486 0 10C0 15.514 4.486 20 10 20C15.514 20 20 15.514 20 10C20 4.486 15.514 0 10 0ZM10 18C5.589 18 2 14.411 2 10C2 5.589 5.589 2 10 2C14.411 2 18 5.589 18 10C18 14.411 14.411 18 10 18ZM10 8C8.896 8 8 8.896 8 10C8 11.104 8.896 12 10 12C11.104 12 12 11.104 12 10C12 8.896 11.104 8 10 8ZM10 6C12.206 6 14 7.794 14 10C14 12.206 12.206 14 10 14C7.794 14 6 12.206 6 10C6 7.794 7.794 6 10 6Z"
                          fill=""
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h6 className="font-medium text-dark dark:text-white">
                        {notification.title}
                      </h6>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {notification.message}
                      </p>
                      {notification.fromStatus && notification.toStatus && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Status: {notification.fromStatus} → {notification.toStatus}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="ml-2 h-2 w-2 rounded-full bg-red-500"></div>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>

          <div className="border-t border-gray-200 p-3 dark:border-gray-700">
            <button
              onClick={handleClearAll}
              className="flex w-full items-center justify-center rounded-md bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
