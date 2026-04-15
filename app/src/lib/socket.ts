import { io, Socket } from 'socket.io-client';

const NOTIFICATION_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:5003';

class SocketClient {
  private static instance: SocketClient;
  public socket: Socket | null = null;

  private constructor() {}

  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  public connect(tenantId: string) {
    if (this.socket) return;

    this.socket = io(NOTIFICATION_SERVICE_URL, {
      query: { tenantId }
    });

    this.socket.on('connect', () => {
      console.log('Connected to Notification Socket');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Notification Socket');
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketClient = SocketClient.getInstance();
