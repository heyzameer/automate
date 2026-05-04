import { io, Socket } from 'socket.io-client';

// Direct connection to notification-service (express-http-proxy cannot tunnel WebSockets)
const NOTIFICATION_SERVICE_URL =
    import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:5006';

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
        // Already connected or connecting — do nothing
        if (this.socket) return;

        this.socket = io(NOTIFICATION_SERVICE_URL, {
            query: { tenantId },
            // ── Reconnection strategy ────────────────────────────────────────
            // Without these, socket.io will retry forever, flooding the
            // browser console with ERR_CONNECTION_REFUSED on every poll.
            reconnection: true,
            reconnectionAttempts: 5,        // give up after 5 tries
            reconnectionDelay: 2000,        // start at 2 s
            reconnectionDelayMax: 30000,    // cap at 30 s between retries
            randomizationFactor: 0.5,
            // ────────────────────────────────────────────────────────────────
            timeout: 10000,
        });

        this.socket.on('connect', () => {
            console.log('[Socket] Connected to Notification Service');
        });

        this.socket.on('disconnect', (reason) => {
            console.log(`[Socket] Disconnected: ${reason}`);
        });

        this.socket.on('connect_error', (err) => {
            // Only log, do not throw — the reconnection strategy above handles retries
            console.warn(`[Socket] Connection error: ${err.message}`);
        });

        this.socket.io.on('reconnect_failed', () => {
            console.warn('[Socket] Max reconnection attempts reached. Notification socket is offline.');
        });
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /** Reset the socket so connect() can be called again (e.g. after re-login) */
    public reset() {
        this.disconnect();
    }
}

export const socketClient = SocketClient.getInstance();
