package com.htc.productdevelopment.controller;

import com.htc.productdevelopment.model.Notification;
import com.htc.productdevelopment.service.WebSocketNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketNotificationController {

    @Autowired
    private WebSocketNotificationService webSocketNotificationService;

    /**
     * Endpoint to send test notifications via WebSocket
     */
    @MessageMapping("/notifications/test")
    public void sendTestNotification(@Payload Notification notification) {
        webSocketNotificationService.sendNotificationToAll(notification);
    }
}