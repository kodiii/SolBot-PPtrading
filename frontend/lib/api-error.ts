/**
 * Standard API error interface
 */
/**
 * Type for JSON-serializable values
 */
export type JsonValue = 
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface ApiErrorData {
  message: string;
  code?: string;
  details?: Record<string, JsonValue>;
  status: number;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error implements ApiErrorData {
  public readonly code?: string;
  public readonly details?: Record<string, JsonValue>;
  public readonly status: number;

  constructor(
    message: string, 
    status = 500, 
    code?: string, 
    details?: Record<string, JsonValue>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromResponse(response: Response): Promise<ApiError> {
    return response.json().then(
      (data: Partial<ApiErrorData>) => new ApiError(
        data.message || 'An unexpected error occurred',
        data.status || response.status,
        data.code,
        data.details
      ),
      () => new ApiError(
        'Failed to parse error response',
        response.status
      )
    );
  }

  /**
   * Convert error to plain object for serialization
   */
  toJSON(): ApiErrorData {
    return {
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
    };
  }
}

/**
 * Handle API errors consistently
 */
export async function handleApiError(error: unknown): Promise<ApiError> {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Response) {
    return ApiError.fromResponse(error);
  }

  if (error instanceof Error) {
    return new ApiError(
      error.message,
      500,
      'UNKNOWN_ERROR',
      { originalError: error.name }
    );
  }

  return new ApiError(
    'An unexpected error occurred',
    500,
    'UNKNOWN_ERROR',
    { originalError: String(error) }
  );
}

/**
 * Type guard for API errors
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Error status codes and messages
 */
export const ErrorCodes = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export const DefaultErrorMessages: Record<keyof typeof ErrorCodes, string> = {
  BAD_REQUEST: 'Invalid request',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'An internal error occurred',
  VALIDATION_ERROR: 'Validation failed',
  DATABASE_ERROR: 'Database operation failed',
} as const;
