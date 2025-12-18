package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.model.Notification;
import com.htc.productdevelopment.service.NotificationService;
import com.htc.productdevelopment.service.UserService;
import com.htc.productdevelopment.model.User;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.ServletException;
import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    
    private User getCurrentUserFromToken() throws ServletException {
        try {
            // Get the current HTTP request
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = attributes.getRequest();
            
            // Get the Authorization header
            String authHeader = request.getHeader("Authorization");
            
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String idToken = authHeader.substring(7); // Remove "Bearer " prefix
                
                // Verify the Firebase ID token
                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
                String uid = decodedToken.getUid();
                
                // Look up user in database
                return userService.getUserByUid(uid).orElse(null);
            }
        } catch (Exception e) {
            // Log the error but don't throw it
            e.printStackTrace();
        }
        
        return null;
    }
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private UserService userService;
    
    /**
     * Get all notifications for the current user
     */
    @GetMapping
    public ResponseEntity<?> getNotifications() {
        try {
            User currentUser = getCurrentUserFromToken();
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "User not authenticated"));
            }
            
            Long userId = currentUser.getId();
            String role = currentUser.getRole().name();
            Long departmentId = currentUser.getDepartmentId();
            Long organizationId = currentUser.getOrganizationId();
            
            List<Notification> notifications = notificationService.getNotificationsForUser(
                userId, role, departmentId, organizationId);
            
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Error fetching notifications: " + e.getMessage()));
        }
    }
    
    /**
     * Get unread notifications count for the current user
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadNotificationsCount() {
        try {
            User currentUser = getCurrentUserFromToken();
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "User not authenticated"));
            }
            
            Long userId = currentUser.getId();
            String role = currentUser.getRole().name();
            Long departmentId = currentUser.getDepartmentId();
            Long organizationId = currentUser.getOrganizationId();
            
            int unreadCount = notificationService.countUnreadNotificationsForUser(
                userId, role, departmentId, organizationId);
            
            Map<String, Integer> response = new HashMap<>();
            response.put("unreadCount", unreadCount);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Error fetching unread count: " + e.getMessage()));
        }
    }
    
    /**
     * Mark a notification as read
     */
    @PutMapping("/{id}/mark-as-read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        try {
            Notification notification = notificationService.markAsRead(id);
            if (notification == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(notification);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Error marking notification as read: " + e.getMessage()));
        }
    }
    
    /**
     * Mark all notifications as read for the current user
     */
    @PutMapping("/mark-all-as-read")
    public ResponseEntity<?> markAllAsRead() {
        try {
            User currentUser = getCurrentUserFromToken();
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "User not authenticated"));
            }
            
            Long userId = currentUser.getId();
            String role = currentUser.getRole().name();
            Long departmentId = currentUser.getDepartmentId();
            Long organizationId = currentUser.getOrganizationId();
            
            notificationService.markAllAsRead(userId, role, departmentId, organizationId);
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Error marking all notifications as read: " + e.getMessage()));
        }
    }
    
    /**
     * Delete a notification
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        try {
            notificationService.deleteNotification(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Error deleting notification: " + e.getMessage()));
        }
    }
    
    /**
     * Delete all notifications for the current user
     */
    @DeleteMapping("/all")
    public ResponseEntity<?> deleteAllNotifications() {
        try {
            User currentUser = getCurrentUserFromToken();
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "User not authenticated"));
            }
            
            Long userId = currentUser.getId();
            String role = currentUser.getRole().name();
            Long departmentId = currentUser.getDepartmentId();
            Long organizationId = currentUser.getOrganizationId();
            
            notificationService.deleteAllNotificationsForUser(userId, role, departmentId, organizationId);
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Error deleting all notifications: " + e.getMessage()));
        }
    }
}