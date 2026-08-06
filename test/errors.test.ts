import { describe, it, expect } from 'vitest';
import {
  InvoiceBuilderError,
  ApiError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  NetworkError,
  TimeoutError,
} from '../src/errors';

describe('SDK Error Hierarchy & Classes', () => {
  it('should instantiate InvoiceBuilderError with default code', () => {
    const err = new InvoiceBuilderError('General SDK failure');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('InvoiceBuilderError');
    expect(err.code).toBe('SDK_ERROR');
    expect(err.message).toBe('General SDK failure');
  });

  it('should instantiate ApiError with options', () => {
    const err = new ApiError({
      message: 'Bad Request',
      statusCode: 400,
      requestId: 'req_12345',
      responseBody: { error: 'invalid_field' },
    });
    expect(err).toBeInstanceOf(InvoiceBuilderError);
    expect(err.statusCode).toBe(400);
    expect(err.requestId).toBe('req_12345');
    expect(err.responseBody).toEqual({ error: 'invalid_field' });
  });

  it('should handle AuthenticationError (401)', () => {
    const err = new AuthenticationError({ message: 'Invalid API key' });
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe('AuthenticationError');
    expect(err.statusCode).toBe(401);
  });

  it('should handle AuthorizationError (403)', () => {
    const err = new AuthorizationError({ message: 'Permission denied' });
    expect(err.name).toBe('AuthorizationError');
    expect(err.statusCode).toBe(403);
  });

  it('should handle NotFoundError (404)', () => {
    const err = new NotFoundError({ message: 'Template not found' });
    expect(err.name).toBe('NotFoundError');
    expect(err.statusCode).toBe(404);
  });

  it('should handle ValidationError (400/422) with details', () => {
    const details = [{ field: 'templateId', message: 'is required' }];
    const err = new ValidationError({
      message: 'Validation failed',
      statusCode: 422,
      validationDetails: details,
    });
    expect(err.name).toBe('ValidationError');
    expect(err.statusCode).toBe(422);
    expect(err.validationDetails).toEqual(details);
  });

  it('should handle RateLimitError (429) with retryAfter', () => {
    const err = new RateLimitError({
      message: 'Rate limit exceeded',
      retryAfter: 15,
    });
    expect(err.name).toBe('RateLimitError');
    expect(err.statusCode).toBe(429);
    expect(err.retryAfter).toBe(15);
  });

  it('should handle InternalServerError (500)', () => {
    const err = new InternalServerError({ message: 'Server error' });
    expect(err.name).toBe('InternalServerError');
    expect(err.statusCode).toBe(500);
  });

  it('should handle NetworkError', () => {
    const orig = new Error('ECONNRESET');
    const err = new NetworkError('Connection reset', orig);
    expect(err.name).toBe('NetworkError');
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err.originalError).toBe(orig);
  });

  it('should handle TimeoutError', () => {
    const err = new TimeoutError('Request timed out after 5000ms', 5000);
    expect(err.name).toBe('TimeoutError');
    expect(err.code).toBe('TIMEOUT_ERROR');
    expect(err.timeoutMs).toBe(5000);
  });
});
