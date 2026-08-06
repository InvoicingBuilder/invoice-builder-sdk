import {
  InvoiceBuilderConfig,
  ListOptions,
  PaginatedResponse,
  InvoiceTemplateItem,
  TemplateFieldsResponse,
  HistoryItem,
  GeneratePdfOptions,
  ApiKeyValidationResponse,
  RequestOptions,
} from './types';
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
} from '../errors';

const DEFAULT_BASE_URL = 'https://api.invoicingbuilder.com';
const DEFAULT_TIMEOUT = 20000;

const ENDPOINTS = {
  AUTH: '/api/v1/auth',
  TEMPLATES: '/api/v1/templates',
  TEMPLATE_FIELDS: '/api/v1/templates/fields',
  HISTORY: '/api/v1/history',
  GENERATE_PDF: '/api/v1/pdf/generate',
} as const;

export class InvoiceBuilder {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: InvoiceBuilderConfig = {}) {
    const apiKey =
      config.apiKey ||
      (typeof process !== 'undefined' ? process.env.INVOICE_BUILDER_API_KEY : undefined);

    if (!apiKey) {
      throw new AuthenticationError({
        message:
          'API Key is required. Provide it in the constructor or set the INVOICE_BUILDER_API_KEY environment variable.',
        statusCode: 401,
      });
    }

    this.apiKey = apiKey.trim();
    this.baseUrl = (DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeout = DEFAULT_TIMEOUT;
  }

  /**
   * Extract request ID from response headers.
   */
  private getRequestId(headers: Headers): string | undefined {
    return (
      headers.get('x-request-id') ||
      headers.get('request-id') ||
      headers.get('x-amzn-requestid') ||
      headers.get('cf-ray') ||
      undefined
    );
  }

  /**
   * Parse Retry-After header or body retryAfter attribute.
   */
  private parseRetryAfter(response: Response, body?: any): number | undefined {
    const headerValue = response.headers.get('retry-after');
    if (headerValue) {
      const parsedSeconds = parseInt(headerValue, 10);
      if (!isNaN(parsedSeconds)) {
        return parsedSeconds;
      }
    }
    if (body && typeof body.retryAfter === 'number') {
      return body.retryAfter;
    }
    return undefined;
  }

  /**
   * Maps failed HTTP responses to standard custom SDK error classes.
   */
  private async handleErrorResponse(response: Response, requestId?: string): Promise<never> {
    let responseBody: any = null;
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const text = await response.text();
      if (text) {
        try {
          responseBody = JSON.parse(text);
          if (responseBody && responseBody.message) {
            errorMessage = Array.isArray(responseBody.message)
              ? responseBody.message.join(', ')
              : responseBody.message;
          }
        } catch {
          responseBody = text;
          errorMessage = text;
        }
      }
    } catch {
      // Failed to read response body
    }

    const options = {
      message: errorMessage,
      statusCode: response.status,
      requestId,
      responseBody,
    };

    switch (response.status) {
      case 400:
      case 422:
        throw new ValidationError({ ...options, validationDetails: responseBody });
      case 401:
        throw new AuthenticationError(options);
      case 403:
        throw new AuthorizationError(options);
      case 404:
        throw new NotFoundError(options);
      case 429: {
        const retryAfter = this.parseRetryAfter(response, responseBody);
        throw new RateLimitError({ ...options, retryAfter });
      }
      case 500:
      case 502:
      case 503:
      case 504:
        throw new InternalServerError(options);
      default:
        throw new ApiError(options);
    }
  }

  /**
   * Centralized HTTP request method supporting timeouts and error mapping.
   */
  private async request(
    path: string,
    options: RequestInit = {},
    requestOptions: RequestOptions = {}
  ): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const timeoutMs = requestOptions.timeout ?? this.timeout;

    const controller = new AbortController();
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    if (requestOptions.signal) {
      if (requestOptions.signal.aborted) {
        clearTimeout(timeoutId);
        controller.abort();
      } else {
        requestOptions.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    const headers = new Headers(options.headers || {});
    headers.set('x-api-key', this.apiKey);
    headers.set('Authorization', `Bearer ${this.apiKey}`);
    headers.set('Accept', 'application/json, application/pdf, image/png, application/zip');

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      const requestId = this.getRequestId(response.headers);
      return await this.handleErrorResponse(response, requestId);
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error instanceof InvoiceBuilderError) {
        throw error;
      }

      if (timedOut || error.name === 'AbortError') {
        throw new TimeoutError(`Request timed out after ${timeoutMs}ms.`, timeoutMs);
      }

      const isNetworkError =
        error instanceof TypeError ||
        error.name === 'FetchError' ||
        error.code === 'ECONNRESET' ||
        error.code === 'ENOTFOUND';

      if (isNetworkError) {
        throw new NetworkError(
          `Network error connecting to ${this.baseUrl}: ${error.message}`,
          error
        );
      }

      throw new InvoiceBuilderError(
        error.message || 'An unexpected error occurred during request execution.'
      );
    }
  }

  /**
   * Validate the API key.
   * Calls GET /api/v1/auth to verify that the key is valid and retrieve metadata.
   */
  async validateKey(requestOptions: RequestOptions = {}): Promise<ApiKeyValidationResponse> {
    const response = await this.request(ENDPOINTS.AUTH, { method: 'GET' }, requestOptions);
    return response.json();
  }

  /**
   * Retrieve all available templates from your account.
   */
  async listTemplates(
    options: ListOptions = {},
    requestOptions: RequestOptions = {}
  ): Promise<PaginatedResponse<InvoiceTemplateItem>> {
    const searchParams = new URLSearchParams();
    if (options.page !== undefined) {
      searchParams.append('page', options.page.toString());
    }
    if (options.limit !== undefined) {
      searchParams.append('limit', options.limit.toString());
    }

    const queryString = searchParams.toString();
    const path = `${ENDPOINTS.TEMPLATES}${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(path, { method: 'GET' }, requestOptions);
    return response.json();
  }

  /**
   * Retrieve editable fields inside a template or history record.
   * Either templateId or historyId must be provided.
   */
  async getTemplateFields(
    options: {
      templateId?: string;
      historyId?: string;
    },
    requestOptions: RequestOptions = {}
  ): Promise<TemplateFieldsResponse> {
    if (!options.templateId && !options.historyId) {
      throw new ValidationError({
        message: 'Either templateId or historyId must be provided.',
        statusCode: 400,
      });
    }

    const searchParams = new URLSearchParams();
    if (options.templateId) searchParams.append('templateId', options.templateId);
    if (options.historyId) searchParams.append('historyId', options.historyId);

    const path = `${ENDPOINTS.TEMPLATE_FIELDS}?${searchParams.toString()}`;
    const response = await this.request(path, { method: 'GET' }, requestOptions);
    return response.json();
  }

  /**
   * Retrieve invoice generation history.
   */
  async listHistory(
    options: ListOptions = {},
    requestOptions: RequestOptions = {}
  ): Promise<PaginatedResponse<HistoryItem>> {
    const searchParams = new URLSearchParams();
    if (options.page !== undefined) {
      searchParams.append('page', options.page.toString());
    }
    if (options.limit !== undefined) {
      searchParams.append('limit', options.limit.toString());
    }

    const queryString = searchParams.toString();
    const path = `${ENDPOINTS.HISTORY}${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(path, { method: 'GET' }, requestOptions);
    return response.json();
  }

  /**
   * Generates high-quality PDF or PNG documents dynamically.
   *
   * Accepts either a single template mapping object or an array of up to 2 mapping objects.
   * Returns binary document buffer (PDF/PNG) or a ZIP archive containing multiple documents.
   */
  async generatePdf(
    payload: GeneratePdfOptions | GeneratePdfOptions[],
    requestOptions: RequestOptions = {}
  ): Promise<Buffer | ArrayBuffer> {
    if (Array.isArray(payload) && payload.length > 2) {
      throw new ValidationError({
        message: 'You can generate a maximum of 2 templates at a time.',
        statusCode: 400,
      });
    }

    const response = await this.request(
      ENDPOINTS.GENERATE_PDF,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      requestOptions
    );

    const arrayBuffer = await response.arrayBuffer();
    return typeof Buffer !== 'undefined' ? Buffer.from(arrayBuffer) : arrayBuffer;
  }
}
