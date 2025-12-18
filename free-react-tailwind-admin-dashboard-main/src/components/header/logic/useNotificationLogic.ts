import { useNotifications } from "../../../context/NotificationContext";
import { useNavigate } from "react-router";

export const useNotificationLogic = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const navigate = useNavigate();

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    navigate
  };
};