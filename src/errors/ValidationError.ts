import { AppError } from "./AppError";

export class ValidationError extends AppError {
  constructor(message = "Validation error", details?: unknown) {
    super(message, {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      details,
    });
  }
}
