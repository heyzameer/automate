import api from "../lib/api";
import { io, Socket } from "socket.io-client";

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

class NotificationService {
  private socket: Socket | null = null;
  private listeners: ((notification: AppNotification) => void)[] = [];

  async getNotifications(): Promise<AppNotification[]> {
    const { data } = await api.get("/notifications");
    return data.data;
  }

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  }

  initSocket(tenantId: string) {
    if (this.socket) return;

    // Connect to gateway which will proxy to notification service
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? "https://orbixapi.nineorbite.in" 
      : "http://localhost:5006"; 
    
    this.socket = io(wsUrl, {
      query: { tenantId }
    });

    this.socket.on("new_notification", (notification: AppNotification) => {
      this.listeners.forEach(cb => cb(notification));
    });
  }

  onNotification(callback: (notification: AppNotification) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
}

export const notificationsService = new NotificationService();
