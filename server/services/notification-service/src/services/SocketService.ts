import { Server } from 'socket.io';
import { logger } from '../utils/logger';

export class SocketService {
    private static instance: SocketService;
    private io: Server | null = null;

    private constructor() {}

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public init(server: any) {
        this.io = new Server(server, {
            cors: { origin: '*' }
        });

        this.io.on('connection', (socket) => {
            const { tenantId } = socket.handshake.query;
            if (tenantId) {
                socket.join(`tenant_${tenantId}`);
                logger.info(`Socket connected for tenant: ${tenantId}`);
            }

            socket.on('disconnect', () => {
                logger.info('Socket disconnected');
            });
        });
    }

    public emitToTenant(tenantId: string, event: string, data: any) {
        if (this.io) {
            this.io.to(`tenant_${tenantId}`).emit(event, data);
            logger.info(`Emitted ${event} to tenant ${tenantId}`);
        }
    }
}
