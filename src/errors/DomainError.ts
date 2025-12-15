export type DomainErrorCode =
  | "COMPANY_NOT_FOUND"
  | "CANDIDATE_NOT_FOUND"
  | "CANDIDATE_EMAIL_CONFLICT"
  | "COMPANY_EMAIL_CONFLICT"
  | "USER_NOT_FOUND"
  | "INVALID_CREDENTIALS"
  | "COMPANY_USER_NOT_FOUND"
  | "COMPANY_USER_EMAIL_CONFLICT"
  | "APPLICATION_ALREADY_EXISTS"
  | "VALIDATION_FAILED"
  | "UNAUTHORIZED"
  | "INVALID_ACCESS_TOKEN"
  | "INVALID_REFRESH_TOKEN"
  | "REFRESH_TOKEN_REVOKED"
  | "FINGERPRINT_MISMATCH"
  | "COMPANY_REQUIRED"
  | "UNKNOWN_DOMAIN_ERROR";

export interface DomainErrorParams {
  message: string;
  code: DomainErrorCode;
  statusCode?: number;
  details?: unknown;
}

export class DomainError extends Error {
  public readonly code: DomainErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(params: DomainErrorParams) {
    super(params.message);
    this.name = "DomainError";
    this.code = params.code;
    this.statusCode = params.statusCode ?? 400;
    this.details = params.details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DomainError);
    }
  }
}

// 404
export function notFound(
  code: Extract<
    DomainErrorCode,
    "CANDIDATE_NOT_FOUND" | "COMPANY_NOT_FOUND" | "USER_NOT_FOUND" | "COMPANY_USER_NOT_FOUND"
  >,
  message: string,
  details?: unknown,
): DomainError {
  return new DomainError({
    code,
    message,
    statusCode: 404,
    details,
  });
}

// 409
export function conflict(
  code: Extract<
    DomainErrorCode,
    "COMPANY_EMAIL_CONFLICT" | "COMPANY_USER_EMAIL_CONFLICT" | "APPLICATION_ALREADY_EXISTS"
  >,
  message: string,
  details?: unknown,
): DomainError {
  return new DomainError({
    code,
    message,
    statusCode: 409,
    details,
  });
}

// 422
export function validationFailed(message: string, details?: unknown): DomainError {
  return new DomainError({
    code: "VALIDATION_FAILED",
    message,
    statusCode: 422,
    details,
  });
}

// 401
export function unauthorized(params: {
  message: string;
  code?: Extract<
    DomainErrorCode,
    | "UNAUTHORIZED"
    | "INVALID_CREDENTIALS"
    | "INVALID_ACCESS_TOKEN"
    | "INVALID_REFRESH_TOKEN"
    | "REFRESH_TOKEN_REVOKED"
    | "COMPANY_REQUIRED"
    | "FINGERPRINT_MISMATCH"
  >;
  details?: unknown;
}): DomainError {
  return new DomainError({
    code: params.code ?? "UNAUTHORIZED",
    message: params.message,
    statusCode: 401,
    details: params.details,
  });
}
