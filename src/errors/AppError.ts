export type AppErrorOptions = {
  statusCode?: number;
  code?: string;
  details?: unknown;
  isOperational?: boolean;
};

export class AppError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;
  isOperational: boolean;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
