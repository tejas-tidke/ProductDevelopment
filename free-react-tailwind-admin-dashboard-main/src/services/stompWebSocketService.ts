import { Client } from '@stomp/stompjs';
import { AppNotification } from "../context/NotificationContext";

class StompWebSocketService {
  private stompClient: Client;
  private onNotificationCallback: ((notification: AppNotification) => void) | null = null;
  private onUnreadCountCallback: ((count: number) => void) | null = null;

  constructor() {
    this.stompClient = new Client({
      // Determine WebSocket URL based on current host
      brokerURL: this.getWebSocketUrl(),
      connectHeaders: {},
      debug: (str) => {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      // Add connection timeout
      connectionTimeout: 10000,
    });

    this.stompClient.onConnect = (frame) => {
      console.log('Connected to STOMP broker:', frame);
      
      // Subscribe to notifications topic
      this.stompClient.subscribe('/topic/notifications', (message) => {
        try {
          const notification: AppNotification = JSON.parse(message.body);
          console.log('%cNOTIFICATION_LOG: Received notification:', 'color: #0066cc; font-weight: bold; background: #f0f8ff; padding: 4px; border-radius: 3px;');
          console.log('%cNOTIFICATION_LOG: Title:', 'color: #0066cc; font-weight: bold;', notification.title);
          console.log('%cNOTIFICATION_LOG: Message:', 'color: #0066cc; font-weight: bold;', notification.message);
          console.log('%cNOTIFICATION_LOG: Issue Key:', 'color: #0066cc; font-weight: bold;', notification.issueKey);
          console.log('%cNOTIFICATION_LOG: Created At:', 'color: #0066cc; font-weight: bold;', notification.createdAt);
          console.log('%cNOTIFICATION_LOG: From Status:', 'color: #0066cc; font-weight: bold;', notification.fromStatus);
          console.log('%cNOTIFICATION_LOG: To Status:', 'color: #0066cc; font-weight: bold;', notification.toStatus);
          console.log('%cNOTIFICATION_LOG: Full Notification Object:', 'color: #0066cc; font-weight: bold;', notification);
          
          if (this.onNotificationCallback) {
            this.onNotificationCallback(notification);
          }
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      });

      // Subscribe to unread count topic
      this.stompClient.subscribe('/topic/unread-count', (message) => {
        try {
          const data = JSON.parse(message.body);
          if (this.onUnreadCountCallback && data.unreadCount !== undefined) {
            this.onUnreadCountCallback(data.unreadCount);
          }
        } catch (error) {
          console.error('Error parsing unread count:', error);
        }
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.stompClient.onWebSocketError = (error) => {
      console.error('WebSocket error:', error);
      console.log('WebSocket connection failed. Please ensure the backend server is running on port 8080.');
    };

    this.stompClient.onDisconnect = () => {
      console.log('Disconnected from STOMP broker');
    };
    
    this.stompClient.onWebSocketClose = (closeEvent) => {
      console.log('WebSocket connection closed:', closeEvent.code, closeEvent.reason);
      if (closeEvent.code !== 1000) { // 1000 is normal close
        console.log('Attempting to reconnect...');
      }
    };
  }

  private getWebSocketUrl(): string {
    // Get the API URL and convert it to WebSocket URL
    let apiUrl = import.meta.env.VITE_API_URL;
    
    if (!apiUrl) {
      // If no VITE_API_URL is set, determine based on current host
      const currentHost = window.location.hostname;
      const currentPort = window.location.port;
      
      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        // Local development
        apiUrl = 'http://localhost:8080';
      } else if (currentHost === '192.168.1.115') {
        // Network access
        apiUrl = 'http://192.168.1.115:8080';
      } else {
        // Default to localhost for any other host
        apiUrl = 'http://localhost:8080';
      }
    }
    
    // Convert HTTP URL to WebSocket URL
    const wsUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws';
    
    console.log('WebSocket URL:', wsUrl); // Debug log
    return wsUrl;
  }

  connect(onNotification: (notification: AppNotification) => void, onUnreadCount: (count: number) => void) {
    // Store callbacks
    this.onNotificationCallback = onNotification;
    this.onUnreadCountCallback = onUnreadCount;

    if (!this.stompClient.active) {
      this.stompClient.activate();
    }
  }

  disconnect() {
    if (this.stompClient.active) {
      this.stompClient.deactivate();
    }
  }

  isConnected() {
    return this.stompClient.active;
  }
}

export const stompWebSocketService = new StompWebSocketService();