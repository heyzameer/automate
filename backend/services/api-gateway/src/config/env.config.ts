export class EnvConfig {
  static get PORT(): number {
    return Number.parseInt(process.env.PORT || '3000', 10);
  }

  static get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development';
  }

  static get LOG_LEVEL(): string {
    return process.env.LOG_LEVEL || 'info';
  }

  static get AUTH_SERVICE_URL(): string {
    return process.env.AUTH_SERVICE_URL || 'http://auth-srv:3001';
  }

  static get CORS_ORIGIN(): string {
    return process.env.CORS_ORIGIN || '*';
  }
}
