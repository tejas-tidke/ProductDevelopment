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
     * Create a notification for a specific user
     */
    public Notification createNotificationForUser(Notification notification, Long userId) {
        notification.setRecipientUserId(userId);
        return notificationRepository.save(notification);
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
     * Create a status transition notification for relevant users
     */
    public void createStatusTransitionNotification(String issueKey, String fromStatus, String toStatus, 
            Long requesterId, String requesterName, Long requesterDepartmentId, Long requesterOrganizationId) {
        
        // Create notification for the requester
        if (requesterId != null) {
            Notification requesterNotification = new Notification();
            requesterNotification.setTitle("Status Updated");
            requesterNotification.setMessage(String.format("Request %s status changed from '%s' to '%s'", 
                issueKey, fromStatus, toStatus));
            requesterNotification.setIssueKey(issueKey);
            requesterNotification.setFromStatus(fromStatus);
            requesterNotification.setToStatus(toStatus);
            requesterNotification.setSenderUserId(requesterId);
            requesterNotification.setSenderName(requesterName);
            createNotificationForUser(requesterNotification, requesterId);
        }
        
        // Create notifications for approvers, admins, and super admins in the same department/organization
        
        // Send to approvers in the same department
        if (requesterDepartmentId != null) {
            Notification approverNotification = new Notification();
            approverNotification.setTitle("Status Updated");
            approverNotification.setMessage(String.format("Request %s status changed from '%s' to '%s' by %s", 
                issueKey, fromStatus, toStatus, requesterName));
            approverNotification.setIssueKey(issueKey);
            approverNotification.setFromStatus(fromStatus);
            approverNotification.setToStatus(toStatus);
            approverNotification.setSenderUserId(requesterId);
            approverNotification.setSenderName(requesterName);
            approverNotification.setRecipientDepartmentId(requesterDepartmentId);
            createNotificationForRole(approverNotification, "APPROVER");
        }
        
        // Send to admins in the same organization
        if (requesterOrganizationId != null) {
            Notification adminNotification = new Notification();
            adminNotification.setTitle("Status Updated");
            adminNotification.setMessage(String.format("Request %s status changed from '%s' to '%s' by %s", 
                issueKey, fromStatus, toStatus, requesterName));
            adminNotification.setIssueKey(issueKey);
            adminNotification.setFromStatus(fromStatus);
            adminNotification.setToStatus(toStatus);
            adminNotification.setSenderUserId(requesterId);
            adminNotification.setSenderName(requesterName);
            adminNotification.setRecipientOrganizationId(requesterOrganizationId);
            createNotificationForRole(adminNotification, "ADMIN");
        }
        
        // Send to super admins (global)
        Notification superAdminNotification = new Notification();
        superAdminNotification.setTitle("Status Updated");
        superAdminNotification.setMessage(String.format("Request %s status changed from '%s' to '%s' by %s", 
            issueKey, fromStatus, toStatus, requesterName));
        superAdminNotification.setIssueKey(issueKey);
        superAdminNotification.setFromStatus(fromStatus);
        superAdminNotification.setToStatus(toStatus);
        superAdminNotification.setSenderUserId(requesterId);
        superAdminNotification.setSenderName(requesterName);
        createNotificationForRole(superAdminNotification, "SUPER_ADMIN");
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