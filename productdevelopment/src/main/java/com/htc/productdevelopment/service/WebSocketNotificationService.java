package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketNotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Send a notification to all connected WebSocket clients
     */
    public void sendNotificationToAll(Notification notification) {
        // Send to the /topic/notifications endpoint for all clients
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }

    /**
     * Send notification count update to all connected WebSocket clients
     */
    public void sendUnreadCountUpdate(int unreadCount) {
        // Send to the /topic/unread-count endpoint for all clients
        messagingTemplate.convertAndSend("/topic/unread-count", 
            new UnreadCountUpdate(unreadCount));
    }

    /**
     * Send a notification to a specific user
     */
    public void sendNotificationToUser(Long userId, Notification notification) {
        // Send to the /user/{userId}/notifications endpoint for specific user
        messagingTemplate.convertAndSendToUser(
            userId.toString(), 
            "/notifications", 
            notification
        );
    }

    /**
     * Send unread count update to a specific user
     */
    public void sendUnreadCountUpdateToUser(Long userId, int unreadCount) {
        // Send to the /user/{userId}/unread-count endpoint for specific user
        messagingTemplate.convertAndSendToUser(
            userId.toString(), 
            "/unread-count", 
            new UnreadCountUpdate(unreadCount)
        );
    }

    /**
     * Inner class for unread count updates
     */
    public static class UnreadCountUpdate {
        private int unreadCount;

        public UnreadCountUpdate() {}

        public UnreadCountUpdate(int unreadCount) {
            this.unreadCount = unreadCount;
        }

        public int getUnreadCount() {
            return unreadCount;
        }

        public void setUnreadCount(int unreadCount) {
            this.unreadCount = unreadCount;
        }
    }
}