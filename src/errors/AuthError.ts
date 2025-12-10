import { AppError } from "./AppError";

export class AuthError extends AppError {
  constructor(message = "Unauthorized", details?: unknown) {
    super(message, {
      statusCode: 401,
      code: "AUTH_ERROR",
      details,
    });
  }
}
