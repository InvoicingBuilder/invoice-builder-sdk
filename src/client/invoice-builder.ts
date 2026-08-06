import {
  InvoiceBuilderConfig,
  ListOptions,
  PaginatedResponse,
  InvoiceTemplateItem,
  TemplateFieldsResponse,
  HistoryItem,
  GeneratePdfOptions,
} from './types';

const BASE_URL = 'https://api.invoicingbuilder.com';

const ENDPOINTS = {
  TEMPLATES: '/api/v1/templates',
  TEMPLATE_FIELDS: '/api/v1/templates/fields',
  HISTORY: '/api/v1/history',
  GENERATE_PDF: '/api/v1/pdf/generate',
} as const;

export class InvoiceBuilder {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: InvoiceBuilderConfig = {}) {
    const apiKey =
      config.apiKey ||
      (typeof process !== 'undefined' ? process.env.INVOICE_BUILDER_API_KEY : undefined);

    if (!apiKey) {
      throw new Error(
        'API Key is required. Provide it in the constructor or set the INVOICE_BUILDER_API_KEY environment variable.'
      );
    }
    this.apiKey = apiKey;
    this.baseUrl = BASE_URL;
  }

  private async request(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'x-api-key': this.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message;
        }
      } catch (e) {
        console.error("Error:", e)
      }
      throw new Error(errorMessage);
    }

    return response;
  }

  /**
   * Retrieve all available templates from your account.
   * Use this endpoint to browse templates and get the `templateId` required for generating invoices.
   */
  async listTemplates(options: ListOptions = {}): Promise<PaginatedResponse<InvoiceTemplateItem>> {
    const searchParams = new URLSearchParams();
    if (options.page !== undefined) {
      searchParams.append('page', options.page.toString());
    }
    if (options.limit !== undefined) {
      searchParams.append('limit', options.limit.toString());
    }

    const queryString = searchParams.toString();
    const path = `${ENDPOINTS.TEMPLATES}${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(path, { method: 'GET' });
    return response.json();
  }

  /**
   * Retrieve all editable fields and components inside a specific template or history record.
   * Either templateId or historyId must be provided.
   */
  async getTemplateFields(options: {
    templateId?: string;
    historyId?: string;
  }): Promise<TemplateFieldsResponse> {
    if (!options.templateId && !options.historyId) {
      throw new Error('Either templateId or historyId must be provided.');
    }

    const searchParams = new URLSearchParams();
    if (options.templateId) searchParams.append('templateId', options.templateId);
    if (options.historyId) searchParams.append('historyId', options.historyId);

    const path = `${ENDPOINTS.TEMPLATE_FIELDS}?${searchParams.toString()}`;
    const response = await this.request(path, { method: 'GET' });
    return response.json();
  }

  /**
   * Retrieve the history of generated invoices and API transactions.
   */
  async listHistory(options: ListOptions = {}): Promise<PaginatedResponse<HistoryItem>> {
    const searchParams = new URLSearchParams();
    if (options.page !== undefined) {
      searchParams.append('page', options.page.toString());
    }
    if (options.limit !== undefined) {
      searchParams.append('limit', options.limit.toString());
    }

    const queryString = searchParams.toString();
    const path = `${ENDPOINTS.HISTORY}${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(path, { method: 'GET' });
    return response.json();
  }

  /**
   * Generates high-quality PDF/PNG documents dynamically.
   *
   * Accepts either a single mapping object or an array of up to 2 mapping objects.
   * If a single object is provided, returns the generated document binary (PDF or PNG).
   * If an array is provided, returns a ZIP file containing the generated documents.
   *
   * @returns Node.js Buffer (if running in Node.js) or ArrayBuffer (in browsers/non-Node environments).
   */
  async generatePdf(
    payload: GeneratePdfOptions | GeneratePdfOptions[]
  ): Promise<Buffer | ArrayBuffer> {
    if (Array.isArray(payload) && payload.length > 2) {
      throw new Error('You can generate a maximum of 2 templates at a time.');
    }

    const response = await this.request(ENDPOINTS.GENERATE_PDF, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const arrayBuffer = await response.arrayBuffer();
    return typeof Buffer !== 'undefined' ? Buffer.from(arrayBuffer) : arrayBuffer;
  }
}
