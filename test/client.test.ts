import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InvoiceBuilder } from '../src/client/invoice-builder';
import { AuthenticationError, ValidationError } from '../src/errors';

describe('InvoiceBuilder Client Initialization', () => {
  const originalEnv = process.env.INVOICE_BUILDER_API_KEY;

  beforeEach(() => {
    delete process.env.INVOICE_BUILDER_API_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.INVOICE_BUILDER_API_KEY = originalEnv;
    } else {
      delete process.env.INVOICE_BUILDER_API_KEY;
    }
  });

  it('should initialize successfully with an explicit API key', () => {
    const client = new InvoiceBuilder({ apiKey: 'ib_test_key_123' });
    expect(client).toBeInstanceOf(InvoiceBuilder);
  });

  it('should initialize successfully with process.env.INVOICE_BUILDER_API_KEY', () => {
    process.env.INVOICE_BUILDER_API_KEY = 'ib_env_key_456';
    const client = new InvoiceBuilder();
    expect(client).toBeInstanceOf(InvoiceBuilder);
  });

  it('should throw AuthenticationError if no API key is provided', () => {
    expect(() => new InvoiceBuilder()).toThrow(AuthenticationError);
    expect(() => new InvoiceBuilder({ apiKey: '' })).toThrow(AuthenticationError);
  });

  it('should validate getTemplateFields parameter requirements', async () => {
    const client = new InvoiceBuilder({ apiKey: 'ib_test_key_123' });
    await expect(client.getTemplateFields({})).rejects.toThrow(ValidationError);
  });

  it('should validate maximum template count for generatePdf', async () => {
    const client = new InvoiceBuilder({ apiKey: 'ib_test_key_123' });
    const payload: any = [
      { templateId: 't1', format: 'pdf' },
      { templateId: 't2', format: 'pdf' },
      { templateId: 't3', format: 'pdf' },
    ];
    await expect(client.generatePdf(payload)).rejects.toThrow(ValidationError);
  });
});
