package com.htc.productdevelopment.repository;

import com.htc.productdevelopment.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Find all notifications ordered by creation date
    List<Notification> findAllByOrderByCreatedAtDesc();
    
    // Find unread notifications ordered by creation date
    List<Notification> findByIsReadFalseOrderByCreatedAtDesc();
    
    // Count unread notifications
    int countByIsReadFalse();
    
    // Find notifications for a specific user
    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(Long userId);
    
    // Find unread notifications for a specific user
    List<Notification> findByRecipientUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
    
    // Count unread notifications for a specific user
    int countByRecipientUserIdAndIsReadFalse(Long userId);
    
    // Find notifications by role
    List<Notification> findByRecipientRoleOrderByCreatedAtDesc(String role);
    
    // Find notifications by department
    List<Notification> findByRecipientDepartmentIdOrderByCreatedAtDesc(Long departmentId);
    
    // Find notifications by organization
    List<Notification> findByRecipientOrganizationIdOrderByCreatedAtDesc(Long organizationId);
    
    // Find notifications for a user by role, department, and organization
    @Query("SELECT n FROM Notification n WHERE " +
           "n.recipientUserId = :userId OR " +
           "(n.recipientRole = :role AND n.recipientDepartmentId IS NULL AND n.recipientOrganizationId IS NULL) OR " +
           "(n.recipientRole = :role AND n.recipientDepartmentId = :departmentId AND n.recipientOrganizationId IS NULL) OR " +
           "(n.recipientRole = :role AND n.recipientOrganizationId = :organizationId AND n.recipientDepartmentId IS NULL) OR " +
           "(n.recipientRole = :role AND n.recipientDepartmentId = :departmentId AND n.recipientOrganizationId = :organizationId) OR " +
           "(n.recipientUserId IS NULL AND n.recipientRole IS NULL AND n.recipientDepartmentId IS NULL AND n.recipientOrganizationId IS NULL)")
    List<Notification> findNotificationsForUser(
        @Param("userId") Long userId,
        @Param("role") String role,
        @Param("departmentId") Long departmentId,
        @Param("organizationId") Long organizationId
    );
    
    // Find unread notifications for a user by role, department, and organization
    @Query("SELECT n FROM Notification n WHERE " +
           "(n.recipientUserId = :userId OR " +
           "(n.recipientRole = :role AND n.recipientDepartmentId IS NULL AND n.recipientOrganizationId IS NULL) OR " +
           "(n.recipientRole = :role AND n.recipientDepartmentId = :departmentId AND n.recipientOrganizationId IS NULL) OR " +
           "(n.recipientRole = :role AND n.recipientOrganizationId = :organizationId AND n.recipientDepartmentId IS NULL) OR " +
           "(n.recipientRole = :role AND n.recipientDepartmentId = :departmentId AND n.recipientOrganizationId = :organizationId) OR " +
           "(n.recipientUserId IS NULL AND n.recipientRole IS NULL AND n.recipientDepartmentId IS NULL AND n.recipientOrganizationId IS NULL)) " +
           "AND n.isRead = false")
    List<Notification> findUnreadNotificationsForUser(
        @Param("userId") Long userId,
        @Param("role") String role,
        @Param("departmentId") Long departmentId,
        @Param("organizationId") Long organizationId
    );
    
    // Count unread notifications for a user by role, department, and organization
    @Query("SELECT COUNT(n) FROM Notification n WHERE " +
           "(n.recipientUserId = :userId OR " +
           "(n.recipientRole = :role AND n.recipientDepartmentId IS NULL AND n.recipientOrganizationId IS NULL) OR " +
           "(n.recipientRole = :role AND n.recipientDepartmentId = :departmentId AND n.recipientOrganizationId IS NULL) OR " +
           "(n.recipientRole = :role AND n.recipientOrganizationId = :organizationId AND n.recipientDepartmentId IS NULL) OR " +
           "(n.recipientRole = :role AND n.recipientDepartmentId = :departmentId AND n.recipientOrganizationId = :organizationId) OR " +
           "(n.recipientUserId IS NULL AND n.recipientRole IS NULL AND n.recipientDepartmentId IS NULL AND n.recipientOrganizationId IS NULL)) " +
           "AND n.isRead = false")
    int countUnreadNotificationsForUser(
        @Param("userId") Long userId,
        @Param("role") String role,
        @Param("departmentId") Long departmentId,
        @Param("organizationId") Long organizationId
    );
}