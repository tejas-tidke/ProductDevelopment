import { useNotifications } from "../../../context/NotificationContext";
import { useNavigate } from "react-router";

export const useNotificationLogic = () => {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    navigate
  };
};