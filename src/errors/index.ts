export interface ApiErrorOptions {
  message: string;
  statusCode: number;
  code?: string;
  requestId?: string;
  responseBody?: any;
  originalError?: Error;
}

/**
  * Base error class for all Invoice Builder SDK errors.
  */
export class InvoiceBuilderError extends Error {
  public readonly code: string;

  constructor(message: string, code = 'SDK_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
  * Base error for HTTP API errors returned by the Invoice Builder server.
  */
export class ApiError extends InvoiceBuilderError {
  public readonly statusCode: number;
  public readonly requestId?: string;
  public readonly responseBody?: any;
  public readonly originalError?: Error;

  constructor(options: ApiErrorOptions) {
    super(options.message, options.code || `API_ERROR_${options.statusCode}`);
    this.name = this.constructor.name;
    this.statusCode = options.statusCode;
    this.requestId = options.requestId;
    this.responseBody = options.responseBody;
    this.originalError = options.originalError;
  }
}

/**
  * Thrown when authentication fails (HTTP 401).
  */
export class AuthenticationError extends ApiError {
  constructor(options: Omit<ApiErrorOptions, 'statusCode'> & { statusCode?: number }) {
    super({
      ...options,
      statusCode: options.statusCode || 401,
      code: options.code || 'AUTHENTICATION_ERROR',
    });
    this.name = 'AuthenticationError';
  }
}

/**
  * Thrown when access is forbidden (HTTP 403).
  */
export class AuthorizationError extends ApiError {
  constructor(options: Omit<ApiErrorOptions, 'statusCode'> & { statusCode?: number }) {
    super({
      ...options,
      statusCode: options.statusCode || 403,
      code: options.code || 'AUTHORIZATION_ERROR',
    });
    this.name = 'AuthorizationError';
  }
}

/**
  * Thrown when a requested resource is not found (HTTP 404).
  */
export class NotFoundError extends ApiError {
  constructor(options: Omit<ApiErrorOptions, 'statusCode'> & { statusCode?: number }) {
    super({
      ...options,
      statusCode: options.statusCode || 404,
      code: options.code || 'NOT_FOUND_ERROR',
    });
    this.name = 'NotFoundError';
  }
}

/**
  * Thrown when request payload validation fails (HTTP 400 / 422).
  */
export class ValidationError extends ApiError {
  public readonly validationDetails?: any;

  constructor(
    options: Omit<ApiErrorOptions, 'statusCode'> & {
      statusCode?: number;
      validationDetails?: any;
    }
  ) {
    super({
      ...options,
      statusCode: options.statusCode || 400,
      code: options.code || 'VALIDATION_ERROR',
    });
    this.name = 'ValidationError';
    this.validationDetails = options.validationDetails ?? options.responseBody;
  }
}

/**
  * Thrown when the rate limit is exceeded (HTTP 429).
  */
export class RateLimitError extends ApiError {
  public readonly retryAfter?: number;

  constructor(
    options: Omit<ApiErrorOptions, 'statusCode'> & {
      statusCode?: number;
      retryAfter?: number;
    }
  ) {
    super({
      ...options,
      statusCode: options.statusCode || 429,
      code: options.code || 'RATE_LIMIT_ERROR',
    });
    this.name = 'RateLimitError';
    this.retryAfter = options.retryAfter;
  }
}

/**
  * Thrown when the backend server encounters an internal error (HTTP 500, 502, 503, 504).
  */
export class InternalServerError extends ApiError {
  constructor(options: Omit<ApiErrorOptions, 'statusCode'> & { statusCode?: number }) {
    super({
      ...options,
      statusCode: options.statusCode || 500,
      code: options.code || 'INTERNAL_SERVER_ERROR',
    });
    this.name = 'InternalServerError';
  }
}

/**
  * Thrown when network connection fails or fetch is aborted due to network loss.
  */
export class NetworkError extends InvoiceBuilderError {
  public readonly originalError?: Error;

  constructor(message = 'Network error occurred. Please check your internet connection.', originalError?: Error) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
    this.originalError = originalError;
  }
}

/**
  * Thrown when a request times out.
  */
export class TimeoutError extends InvoiceBuilderError {
  public readonly timeoutMs?: number;

  constructor(message = 'Request timed out.', timeoutMs?: number) {
    super(message, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}
