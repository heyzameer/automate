import pino from 'pino';
import { HttpLogger, pinoHttp } from 'pino-http';

export interface LoggerConfig {
  level?: string;
  nodeEnv?: string;
  serviceName: string;
}

export const createLogger = (config: LoggerConfig) => {
  const isDevelopment = config.nodeEnv === 'development' || !config.nodeEnv;

  return pino({
    name: config.serviceName,
    level: config.level || 'info',
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        }
      : undefined,
  });
};

export const createHttpLogger = (logger: pino.Logger): HttpLogger => {
  return pinoHttp({
    logger,
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        query: req.query,
        params: req.params,
        headers: {
          'user-agent': req.headers['user-agent'],
          'x-forwarded-for': req.headers['x-forwarded-for'],
          host: req.headers['host'],
        },
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  });
};

export type Logger = pino.Logger;
