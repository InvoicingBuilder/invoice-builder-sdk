export type DocFormat = 'pdf' | 'png' | 'zip';

export type Environment = 'production' | 'sandbox';

export interface ListOptions {
  /**
   * The page number to retrieve (starts at 1).
   */
  page?: number;
  /**
   * The number of items to return per page.
   */
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ComponentConfig {
  id: string;
  type: string;
  properties?: Record<string, any>;
  children?: ComponentConfig[];
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  components: ComponentConfig[];
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
  isDefaultCopy?: boolean;
  currency?: string;
  numberFormat?: string;
  isWatermark?: boolean;
  watermarkProperties?: Record<string, any>;
}

export interface Invoice {
  id: string;
  date: string;
  dueDate: string;
  templateId: string;
  templateName: string;
  components: ComponentConfig[];
  balanceDue: string;
  currency?: string;
  createdAt: string;
  updatedAt: string;
  numberFormat?: string;
  isPaid?: boolean;
  isWatermark?: boolean;
  watermarkProperties?: Record<string, any>;
}

export interface InvoiceTemplateItem {
  id: string;
  template: InvoiceTemplate;
  updatedAt: string;
}

export interface HistoryItem {
  id: string;
  invoice: Invoice;
  updatedAt: string;
}

export interface TemplateField {
  id: string;
  type: string;
  label: string;
  value: any;
}

export interface TemplateFieldsResponse {
  id: string;
  source: 'history' | 'template';
  updatedAt: string;
  fields: TemplateField[];
}

export interface GeneratePdfOptions {
  /**
   * Target invoice template ID.
   */
  templateId: string;
  /**
   * Format of the generated binary output.
   */
  format: 'pdf' | 'png';
  /**
   * Key-value mapping of field values to insert into the template.
   * Keys can be component IDs, types, or label names.
   */
  fields?: Record<string, any>;
}

export interface InvoiceBuilderConfig {
  /**
   * Your API key starting with 'ib_'.
   * If not provided, falls back to the `INVOICE_BUILDER_API_KEY` environment variable.
   */
  apiKey?: string;
  /**
   * The target environment. Maps to preconfigured base URLs:
   * - 'production': 'https://api.invoicingbuilder.com'
   * - 'sandbox': 'https://api.dev.invoicingbuilder.com'
   *
   * By default 'production'.
   */
  environment?: Environment;
}
