import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { notificationApi } from "../services/api";
import { stompWebSocketService } from "../services/stompWebSocketService";

export interface AppNotification {
  id: number; // Changed from string to number to match backend
  title: string;
  message: string;
  issueKey: string;
  createdAt: string; // Will be a string representation of LocalDateTime
  isRead: boolean;
  fromStatus?: string;
  toStatus?: string;
  senderName?: string;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>; // Changed from string to number
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      console.log("%cNOTIFICATION_LOG: Fetching notifications from backend...", "color: #6600cc; font-weight: bold; background: #f8f0ff; padding: 4px; border-radius: 3px;");
      const fetchedNotifications = await notificationApi.getNotifications();
      console.log("%cNOTIFICATION_LOG: Received notifications:", "color: #6600cc; font-weight: bold; background: #f8f0ff; padding: 4px; border-radius: 3px;", fetchedNotifications);
      console.log("%cNOTIFICATION_LOG: Total notifications received:", "color: #6600cc; font-weight: bold;", fetchedNotifications.length);
      setNotifications(fetchedNotifications);
      
      // Update unread count
      const unread = fetchedNotifications.filter((n: AppNotification) => !n.isRead).length;
      console.log("%cNOTIFICATION_LOG: Unread count:", "color: #6600cc; font-weight: bold;", unread);
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  // Fetch unread count from backend
  const fetchUnreadCount = async () => {
    try {
      console.log("Fetching unread count from backend...");
      const response = await notificationApi.getUnreadCount();
      console.log("Received unread count response:", response);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  // Refresh notifications and unread count
  const refreshNotifications = async () => {
    console.log('%cNOTIFICATION_LOG: Refreshing notifications and unread count', 'color: #0066cc; font-weight: bold; background: #f0f8ff; padding: 4px; border-radius: 3px;');
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    console.log('%cNOTIFICATION_LOG: Notifications refreshed successfully', 'color: #0066cc; font-weight: bold; background: #f0f8ff; padding: 4px; border-radius: 3px;');
  };

  // Mark a notification as read
  const markAsRead = async (id: number) => { // Changed from string to number
    try {
      console.log("Marking notification as read:", id);
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      console.log("Marking all notifications as read");
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    try {
      console.log("Clearing all notifications");
      await notificationApi.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  // Fetch notifications on component mount and connect to WebSocket
  useEffect(() => {
    refreshNotifications();
    
    // Connect to WebSocket for real-time notifications
    stompWebSocketService.connect(
      (notification: AppNotification) => {
        // Add the new notification to the list
        setNotifications(prev => [notification, ...prev]);
        
        // Update unread count
        setUnreadCount(prev => prev + 1);
        
        // Log notification in browser console with prominent styling
        console.log('%cNOTIFICATION_LOG: New notification added to context', 'color: #009900; font-weight: bold; background: #f0fff0; padding: 4px; border-radius: 3px;');
        console.log('%cNOTIFICATION_LOG: Title:', 'color: #009900; font-weight: bold;', notification.title);
        console.log('%cNOTIFICATION_LOG: Message:', 'color: #009900; font-weight: bold;', notification.message);
        console.log('%cNOTIFICATION_LOG: Issue Key:', 'color: #009900; font-weight: bold;', notification.issueKey);
        console.log('%cNOTIFICATION_LOG: From Status:', 'color: #009900; font-weight: bold;', notification.fromStatus);
        console.log('%cNOTIFICATION_LOG: To Status:', 'color: #009900; font-weight: bold;', notification.toStatus);
        console.log('%cNOTIFICATION_LOG: Full Notification:', 'color: #009900; font-weight: bold;', notification);
      },
      (count: number) => {
        // Update unread count from WebSocket
        setUnreadCount(count);
        
        // Log unread count update
        console.log('%cNOTIFICATION_LOG: Unread count updated', 'color: #ff6600; font-weight: bold; background: #fff8f0; padding: 4px; border-radius: 3px;');
        console.log('%cNOTIFICATION_LOG: New unread count:', 'color: #ff6600; font-weight: bold;', count);
      }
    );
    
    // Set up polling to refresh notifications every 2 minutes (reduced from 30 seconds)
    const interval = setInterval(refreshNotifications, 120000);
    
    return () => {
      clearInterval(interval);
      stompWebSocketService.disconnect();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, refreshNotifications, markAsRead, markAllAsRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
};