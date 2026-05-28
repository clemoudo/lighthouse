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
 * Custom error class for API errors.
 * Compatible with Express error handling.
 */
export class ApiError extends Error {
  public code: ErrorCode
  public details?: unknown
  public statusCode: number

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.name = "ApiError"

    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, ApiError.prototype)

    // Capturer la stack trace (propre à V8/Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }
}
