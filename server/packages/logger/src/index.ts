import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

/**
 * @carbot/logger
 * ═══════════════════════════════════════════════════════════
 * Centralised Winston logger factory.
 * Provides structured logging with file rotation and console output.
 * ═══════════════════════════════════════════════════════════
 */

const consoleFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
    }
    return log;
});

/**
 * Factory function to create a configured Winston logger instance
 * @param serviceName - Name of the service for metadata tracking
 * @param logsConfig - Optional configuration overrides
 */
export const createLogger = (serviceName: string, logsConfig?: any) => {
    const logDir = logsConfig?.directory || 'logs';

    const fileRotateTransport = new DailyRotateFile({
        filename: `${logDir}/${serviceName}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: logsConfig?.maxSize || '20m',
        maxFiles: logsConfig?.maxFiles || '7d',
        level: 'info',
    });

    const errorRotateTransport = new DailyRotateFile({
        filename: `${logDir}/${serviceName}-error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: logsConfig?.maxSize || '10m',
        maxFiles: logsConfig?.maxFiles || '14d',
        level: 'error',
    });

    return winston.createLogger({
        level: logsConfig?.level || 'info',
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.json()
        ),
        defaultMeta: { service: serviceName },
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    consoleFormat
                ),
            }),
            fileRotateTransport,
            errorRotateTransport
        ],
    });
};
