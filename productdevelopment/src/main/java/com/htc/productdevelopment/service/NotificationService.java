package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.Notification;
import com.htc.productdevelopment.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private WebSocketNotificationService webSocketNotificationService;
    
    /**
     * Get all notifications (visible to everyone)
     */
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc();
    }
    
    /**
     * Get all unread notifications (visible to everyone)
     */
    public List<Notification> getAllUnreadNotifications() {
        return notificationRepository.findByIsReadFalseOrderByCreatedAtDesc();
    }
    
    /**
     * Count all unread notifications
     */
    public int countAllUnreadNotifications() {
        return notificationRepository.countByIsReadFalse();
    }
    
    /**
     * Mark all notifications as read
     */
    public void markAllAsRead() {
        List<Notification> unreadNotifications = getAllUnreadNotifications();
        for (Notification notification : unreadNotifications) {
            notification.setIsRead(true);
        }
        if (!unreadNotifications.isEmpty()) {
            notificationRepository.saveAll(unreadNotifications);
        }
        
        // Broadcast the updated unread count
        int unreadCount = countAllUnreadNotifications();
        webSocketNotificationService.sendUnreadCountUpdate(unreadCount);
    }
    
    /**
     * Delete all notifications
     */
    public void deleteAllNotifications() {
        notificationRepository.deleteAll();
    }
    
    /**
     * Create a notification for a specific user
     */
    public Notification createNotificationForUser(Notification notification, Long userId) {
        notification.setRecipientUserId(userId);
        System.out.println("Creating notification for user ID: " + userId + " with title: " + notification.getTitle());
        Notification saved = notificationRepository.save(notification);
        System.out.println("Saved notification with ID: " + saved.getId());
        
        // Broadcast the notification via WebSocket to the specific user
        webSocketNotificationService.sendNotificationToUser(userId, saved);
        
        // Also broadcast the updated unread count to the specific user
        int unreadCount = notificationRepository.countByRecipientUserIdAndIsReadFalse(userId);
        webSocketNotificationService.sendUnreadCountUpdateToUser(userId, unreadCount);
        
        return saved;
    }
    
    /**
     * Create a notification for users with a specific role
     */
    public Notification createNotificationForRole(Notification notification, String role) {
        notification.setRecipientRole(role);
        Notification saved = notificationRepository.save(notification);
        
        // Broadcast the notification via WebSocket
        webSocketNotificationService.sendNotificationToAll(saved);
        
        // Also broadcast the updated unread count
        int unreadCount = countAllUnreadNotifications();
        webSocketNotificationService.sendUnreadCountUpdate(unreadCount);
        
        return saved;
    }
    
    /**
     * Create a notification for users in a specific department
     */
    public Notification createNotificationForDepartment(Notification notification, Long departmentId) {
        notification.setRecipientDepartmentId(departmentId);
        Notification saved = notificationRepository.save(notification);
        
        // Broadcast the notification via WebSocket
        webSocketNotificationService.sendNotificationToAll(saved);
        
        // Also broadcast the updated unread count
        int unreadCount = countAllUnreadNotifications();
        webSocketNotificationService.sendUnreadCountUpdate(unreadCount);
        
        return saved;
    }
    
    /**
     * Create a notification for users in a specific organization
     */
    public Notification createNotificationForOrganization(Notification notification, Long organizationId) {
        notification.setRecipientOrganizationId(organizationId);
        Notification saved = notificationRepository.save(notification);
        
        // Broadcast the notification via WebSocket
        webSocketNotificationService.sendNotificationToAll(saved);
        
        // Also broadcast the updated unread count
        int unreadCount = countAllUnreadNotifications();
        webSocketNotificationService.sendUnreadCountUpdate(unreadCount);
        
        return saved;
    }
    
    /**
     * Create a notification for all users (global notification)
     */
    public Notification createGlobalNotification(Notification notification) {
        // Set all recipient fields to null for global notifications
        notification.setRecipientUserId(null);
        notification.setRecipientRole(null);
        notification.setRecipientDepartmentId(null);
        notification.setRecipientOrganizationId(null);
        Notification saved = notificationRepository.save(notification);
        
        // Broadcast the notification via WebSocket
        webSocketNotificationService.sendNotificationToAll(saved);
        
        // Also broadcast the updated unread count
        int unreadCount = countAllUnreadNotifications();
        webSocketNotificationService.sendUnreadCountUpdate(unreadCount);
        
        return saved;
    }
    
    /**
     * Send a notification to all users
     * @param title The notification title
     * @param message The notification message
     * @param issueKey The associated issue key (optional)
     * @param senderName The name of the sender (optional)
     * @param senderUserId The ID of the sender (optional)
     */
    public void sendNotificationToAll(String title, String message, String issueKey, String senderName, Long senderUserId) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setIssueKey(issueKey);
        notification.setSenderName(senderName);
        notification.setSenderUserId(senderUserId);
        
        // Create as global notification (visible to everyone)
        createGlobalNotification(notification);
    }
    
    /**
     * Create a status transition notification for all users
     * Sends notifications showing only the issue key and status transition
     */
    public void createStatusTransitionNotification(String issueKey, String fromStatus, String toStatus, 
            Long requesterId, String requesterName, Long requesterDepartmentId, Long requesterOrganizationId,
            Long statusChangerId, String statusChangerName) {
        
        System.out.println("Creating status transition notification for issue: " + issueKey + 
            " from: " + fromStatus + " to: " + toStatus + 
            " requesterId: " + requesterId + " statusChangerId: " + statusChangerId);
        logger.info("NOTIFICATION_LOG: Creating status transition notification - Issue: {}, From: {}, To: {}, RequesterId: {}, StatusChangerId: {}", 
            issueKey, fromStatus, toStatus, requesterId, statusChangerId);
        
        String message = String.format("Request %s status changed from '%s' to '%s'", issueKey, fromStatus, toStatus);
        boolean hasTargeting = requesterDepartmentId != null || requesterOrganizationId != null;
        boolean hasRequester = requesterId != null;

        // Targeted notifications: requester (if known)
        if (hasRequester) {
            createTargetedNotification("Status Updated", issueKey,
                message, fromStatus, toStatus,
                requesterId, requesterDepartmentId, requesterOrganizationId,
                null,  // role not needed for direct recipient
                statusChangerId, statusChangerName);
        }

        if (hasTargeting) {
            // Approvers
            createTargetedNotification("Status Updated", issueKey,
                message, fromStatus, toStatus,
                null, requesterDepartmentId, requesterOrganizationId,
                "APPROVER",
                statusChangerId, statusChangerName);
            // Admins
            createTargetedNotification("Status Updated", issueKey,
                message, fromStatus, toStatus,
                null, requesterDepartmentId, requesterOrganizationId,
                "ADMIN",
                statusChangerId, statusChangerName);
        } else if (!hasRequester) {
            // Fallback to global only if we have no specific targeting and no requester user to notify
            sendNotificationToAll(
                "Status Updated",
                message,
                issueKey,
                statusChangerName,
                statusChangerId
            );
        }
        logger.info("NOTIFICATION_LOG: Notification saved for issue {} transition from '{}' to '{}'", issueKey, fromStatus, toStatus);
    }

    /**
     * Create notifications when a request is created
     */
    public void createRequestCreatedNotification(String issueKey, Long creatorId, Long departmentId, Long organizationId, String creatorName) {
        String message = String.format("Request %s has been created", issueKey);
        boolean hasTargeting = departmentId != null || organizationId != null;
        boolean hasCreator = creatorId != null;

        // Notify creator (if known)
        if (hasCreator) {
            createTargetedNotification("Request Created", issueKey, message, null, null,
                creatorId, departmentId, organizationId, null, creatorId, creatorName);
        }

        if (hasTargeting) {
            // Notify approvers in same org/department
            createTargetedNotification("Request Created", issueKey, message, null, null,
                null, departmentId, organizationId, "APPROVER", creatorId, creatorName);
            // Notify admins in same org/department
            createTargetedNotification("Request Created", issueKey, message, null, null,
                null, departmentId, organizationId, "ADMIN", creatorId, creatorName);
        } else if (!hasCreator) {
            // Fallback global only if no creator info to target
            sendNotificationToAll("Request Created", message, issueKey, creatorName, creatorId);
        }
    }

    /**
     * Persist a targeted notification without broadcasting globally.
     */
    private void createTargetedNotification(String title, String issueKey, String message, String fromStatus, String toStatus,
                                            Long recipientUserId, Long recipientDepartmentId, Long recipientOrganizationId,
                                            String recipientRole, Long senderUserId, String senderName) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setIssueKey(issueKey);
        notification.setFromStatus(fromStatus);
        notification.setToStatus(toStatus);
        notification.setSenderUserId(senderUserId);
        notification.setSenderName(senderName);
        notification.setRecipientUserId(recipientUserId);
        notification.setRecipientDepartmentId(recipientDepartmentId);
        notification.setRecipientOrganizationId(recipientOrganizationId);
        notification.setRecipientRole(recipientRole);

        notificationRepository.save(notification);
    }
    
    /**
     * Get all notifications for a user
     */
    public List<Notification> getNotificationsForUser(Long userId, String role, Long departmentId, Long organizationId) {
        return notificationRepository.findNotificationsForUser(userId, role, departmentId, organizationId);
    }
    
    /**
     * Get unread notifications for a user
     */
    public List<Notification> getUnreadNotificationsForUser(Long userId, String role, Long departmentId, Long organizationId) {
        return notificationRepository.findUnreadNotificationsForUser(userId, role, departmentId, organizationId);
    }
    
    /**
     * Count unread notifications for a user
     */
    public int countUnreadNotificationsForUser(Long userId, String role, Long departmentId, Long organizationId) {
        return notificationRepository.countUnreadNotificationsForUser(userId, role, departmentId, organizationId);
    }
    
    /**
     * Mark a notification as read
     */
    public Notification markAsRead(Long notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            notification.setIsRead(true);
            Notification saved = notificationRepository.save(notification);
            
            // Broadcast the updated unread count
            int unreadCount = countAllUnreadNotifications();
            webSocketNotificationService.sendUnreadCountUpdate(unreadCount);
            
            return saved;
        }
        return null;
    }
    
    /**
     * Mark all notifications as read for a user
     */
    public void markAllAsRead(Long userId, String role, Long departmentId, Long organizationId) {
        List<Notification> notifications = getUnreadNotificationsForUser(userId, role, departmentId, organizationId);
        for (Notification notification : notifications) {
            notification.setIsRead(true);
        }
        if (!notifications.isEmpty()) {
            notificationRepository.saveAll(notifications);
        }
    }
    
    /**
     * Delete a notification
     */
    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }
    
    /**
     * Delete all notifications for a user
     */
    public void deleteAllNotifications(Long userId) {
        List<Notification> userNotifications = notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(userId);
        if (!userNotifications.isEmpty()) {
            notificationRepository.deleteAll(userNotifications);
        }
    }
    
    /**
     * Delete all notifications visible to a user based on their role, department, and organization
     */
    public void deleteAllNotificationsForUser(Long userId, String role, Long departmentId, Long organizationId) {
        List<Notification> notifications = getNotificationsForUser(userId, role, departmentId, organizationId);
        if (!notifications.isEmpty()) {
            notificationRepository.deleteAll(notifications);
        }
    }
}