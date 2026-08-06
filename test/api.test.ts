import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InvoiceBuilder } from '../src/client/invoice-builder';
import { AuthenticationError, NotFoundError } from '../src/errors';

describe('InvoiceBuilder API Endpoints', () => {
  let client: InvoiceBuilder;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    client = new InvoiceBuilder({
      apiKey: 'ib_test_valid_key',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should validate API key via validateKey (GET /api/v1/auth)', async () => {
    const mockAuthResponse = {
      keyPrefix: 'ib_test',
      name: 'Test Key',
      status: 'active',
      expiresAt: null,
      lastUsedAt: '2026-08-06T10:00:00Z',
      valid: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'x-request-id': 'req_auth_1' }),
      json: async () => mockAuthResponse,
    });

    const result = await client.validateKey();
    expect(result).toEqual(mockAuthResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.invoicingbuilder.com/api/v1/auth',
      expect.objectContaining({
        method: 'GET',
        headers: expect.any(Headers),
      })
    );
  });

  it('should list templates via listTemplates (GET /api/v1/templates)', async () => {
    const mockTemplates = {
      items: [
        { id: 'tpl_1', template: { id: 'tpl_1', name: 'Standard' }, updatedAt: '2026-08-01' },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => mockTemplates,
    });

    const res = await client.listTemplates({ page: 1, limit: 10 });
    expect(res).toEqual(mockTemplates);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.invoicingbuilder.com/api/v1/templates?page=1&limit=10',
      expect.anything()
    );
  });

  it('should retrieve fields via getTemplateFields (GET /api/v1/templates/fields)', async () => {
    const mockFields = {
      id: 'tpl_1',
      source: 'template',
      updatedAt: '2026-08-01',
      fields: [{ id: 'f1', type: 'text', label: 'Company Name', value: '' }],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => mockFields,
    });

    const res = await client.getTemplateFields({ templateId: 'tpl_1' });
    expect(res).toEqual(mockFields);
  });

  it('should list history via listHistory (GET /api/v1/history)', async () => {
    const mockHistory = {
      items: [],
      total: 0,
      page: 1,
      limit: 5,
      totalPages: 0,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => mockHistory,
    });

    const res = await client.listHistory({ page: 1, limit: 5 });
    expect(res).toEqual(mockHistory);
  });

  it('should generate PDF via generatePdf (POST /api/v1/pdf/generate)', async () => {
    const fakeBuffer = new Uint8Array([37, 80, 68, 70]).buffer; // %PDF

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/pdf' }),
      arrayBuffer: async () => fakeBuffer,
    });

    const res = await client.generatePdf({
      templateId: 'tpl_1',
      format: 'pdf',
      fields: { inv_no: '1001' },
    });

    expect(res).toBeDefined();
  });

  it('should throw AuthenticationError on 401 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
      text: async () => JSON.stringify({ message: 'Invalid API key' }),
    });

    await expect(client.listTemplates()).rejects.toThrow(AuthenticationError);
  });

  it('should throw NotFoundError on 404 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: new Headers(),
      text: async () => JSON.stringify({ message: 'Template not found' }),
    });

    await expect(client.getTemplateFields({ templateId: 'invalid_id' })).rejects.toThrow(NotFoundError);
  });
});
