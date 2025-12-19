package com.htc.productdevelopment.service;

import com.htc.productdevelopment.model.Notification;
import com.htc.productdevelopment.model.User;
import com.htc.productdevelopment.repository.NotificationRepository;
import com.htc.productdevelopment.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
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
        return saved;
    }
    
    /**
     * Create a notification for users with a specific role
     */
    public Notification createNotificationForRole(Notification notification, String role) {
        notification.setRecipientRole(role);
        return notificationRepository.save(notification);
    }
    
    /**
     * Create a notification for users in a specific department
     */
    public Notification createNotificationForDepartment(Notification notification, Long departmentId) {
        notification.setRecipientDepartmentId(departmentId);
        return notificationRepository.save(notification);
    }
    
    /**
     * Create a notification for users in a specific organization
     */
    public Notification createNotificationForOrganization(Notification notification, Long organizationId) {
        notification.setRecipientOrganizationId(organizationId);
        return notificationRepository.save(notification);
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
        return notificationRepository.save(notification);
    }
    
    /**
     * Create a status transition notification for all users
     * Sends notifications to both the requester and the user who changed the status
     */
    public void createStatusTransitionNotification(String issueKey, String fromStatus, String toStatus, 
            Long requesterId, String requesterName, Long requesterDepartmentId, Long requesterOrganizationId,
            Long statusChangerId, String statusChangerName) {
        
        System.out.println("Creating status transition notification for issue: " + issueKey + 
            " from: " + fromStatus + " to: " + toStatus + 
            " requesterId: " + requesterId + " statusChangerId: " + statusChangerId);
        
        // Create notification for the requester (if different from status changer)
        if (requesterId != null && !requesterId.equals(statusChangerId)) {
            Notification requesterNotification = new Notification();
            requesterNotification.setTitle("Status Updated");
            requesterNotification.setMessage(String.format("Request %s status changed from '%s' to '%s'", 
                issueKey, fromStatus, toStatus));
            requesterNotification.setIssueKey(issueKey);
            requesterNotification.setFromStatus(fromStatus);
            requesterNotification.setToStatus(toStatus);
            requesterNotification.setSenderUserId(statusChangerId != null ? statusChangerId : requesterId);
            requesterNotification.setSenderName(statusChangerName != null ? statusChangerName : requesterName);
            // Create as global notification (visible to everyone)
            createGlobalNotification(requesterNotification);
        }
        
        // Create notification for the user who changed the status (if different from requester)
        if (statusChangerId != null && !statusChangerId.equals(requesterId)) {
            Notification statusChangerNotification = new Notification();
            statusChangerNotification.setTitle("Status Updated");
            statusChangerNotification.setMessage(String.format("Request %s status changed from '%s' to '%s'", 
                issueKey, fromStatus, toStatus));
            statusChangerNotification.setIssueKey(issueKey);
            statusChangerNotification.setFromStatus(fromStatus);
            statusChangerNotification.setToStatus(toStatus);
            statusChangerNotification.setSenderUserId(statusChangerId);
            statusChangerNotification.setSenderName(statusChangerName);
            // Create as global notification (visible to everyone)
            createGlobalNotification(statusChangerNotification);
        }
        
        // Create a general notification for all other users
        Notification generalNotification = new Notification();
        generalNotification.setTitle("Status Updated");
        generalNotification.setMessage(String.format("Request %s status changed from '%s' to '%s' by %s", 
            issueKey, fromStatus, toStatus, requesterName));
        generalNotification.setIssueKey(issueKey);
        generalNotification.setFromStatus(fromStatus);
        generalNotification.setToStatus(toStatus);
        generalNotification.setSenderUserId(requesterId);
        generalNotification.setSenderName(requesterName);
        // Create as global notification (visible to everyone)
        createGlobalNotification(generalNotification);
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
            return notificationRepository.save(notification);
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