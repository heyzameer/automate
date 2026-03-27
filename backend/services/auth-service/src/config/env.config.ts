export class EnvConfig {
  static get PORT(): number {
    return Number.parseInt(process.env.PORT || '3001', 10);
  }

  static get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development';
  }

  static get LOG_LEVEL(): string {
    return process.env.LOG_LEVEL || 'info';
  }

  static get DATABASE_URL(): string {
    return process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/auth_service?schema=public';
  }

  static get JWT_SECRET(): string {
    return process.env.JWT_SECRET || 'your-secret-key';
  }
}
