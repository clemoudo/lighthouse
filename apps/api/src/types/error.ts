import createError from "http-errors"

export type ErrorCode =
  | "INTERNAL_SERVER_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMIT_EXCEEDED"
  | "DOCUMENT_TOO_LARGE"
  | "INGESTION_FAILED"
  | "LLM_TIMEOUT"

export interface ApiErrorResponse {
  code: ErrorCode
  message: string
  details?: unknown
  timestamp: string
}

/**
 * Custom error class extending http-errors.
 * Allows passing a custom machine-readable code for the frontend.
 */
export class ApiError extends createError.HttpError {
  public code: ErrorCode
  public details?: unknown
  public statusCode: number

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.name = "ApiError"
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}
