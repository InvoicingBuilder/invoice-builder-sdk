import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InvoiceBuilder } from '../src/client/invoice-builder';
import { RateLimitError } from '../src/errors';

describe('Rate Limit Exception Handling (HTTP 429)', () => {
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw RateLimitError when backend returns HTTP 429 with retry-after header', async () => {
    const client = new InvoiceBuilder({ apiKey: 'ib_test_key' });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: new Headers({ 'retry-after': '12' }),
      text: async () => JSON.stringify({ message: 'Rate limit exceeded' }),
    });

    try {
      await client.listTemplates();
      expect.fail('Expected RateLimitError to be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(RateLimitError);
      expect(err.statusCode).toBe(429);
      expect(err.retryAfter).toBe(12);
    }
  });

  it('should extract retryAfter attribute from JSON body if header is absent', async () => {
    const client = new InvoiceBuilder({ apiKey: 'ib_test_key' });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: new Headers(),
      text: async () => JSON.stringify({ message: 'Rate limit exceeded', retryAfter: 30 }),
    });

    try {
      await client.listTemplates();
      expect.fail('Expected RateLimitError to be thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(RateLimitError);
      expect(err.statusCode).toBe(429);
      expect(err.retryAfter).toBe(30);
    }
  });
});
