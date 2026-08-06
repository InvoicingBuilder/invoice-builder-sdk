import {
  InvoiceBuilder,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  ApiError,
  GeneratePdfOptions,
} from '@invoicing-builder/invoice-builder-sdk';

async function main() {
  console.log('🚀 Initializing Invoice Builder SDK (TypeScript)...');

  // 1. Client Initialization with Custom Options
  const apiKey = 'ib_test_sample_key_12345';
  const client = new InvoiceBuilder({
    apiKey,
  });

  try {
    // 2. Validate API Key
    console.log('🔑 Validating API Key...');
    const authStatus = await client.validateKey();
    console.log(`✅ API Key Valid: ${authStatus.valid} (Prefix: ${authStatus.keyPrefix})`);

    // 3. List Invoice Templates with Pagination
    console.log('📋 Fetching Invoice Templates (Page 1, Limit 5)...');
    const templatesResponse = await client.listTemplates({ page: 1, limit: 5 });
    console.log(`Found ${templatesResponse.total} total template(s). Returned: ${templatesResponse.items.length}`);

    if (templatesResponse.items.length) {
      const firstTemplate = templatesResponse.items[0];
      console.log(`📄 First Template ID: ${firstTemplate.id}`);

      // 4. Retrieve Editable Template Fields
      console.log(`🔍 Fetching fields for template: ${firstTemplate.id}...`);
      const fieldsResponse = await client.getTemplateFields({ templateId: firstTemplate.id });
      console.log(`Extracted ${fieldsResponse.fields.length} field(s) from template.`);

      // 5. Generate a PDF Document
      console.log('⚡ Generating PDF invoice...');
      const pdfOptions: GeneratePdfOptions = {
        templateId: firstTemplate.id,
        format: 'pdf',
        fields: {
          invoice_number: 'INV-2026-001',
          client_name: 'Acme Corporation',
          amount_due: '$1,250.00',
        },
      };

      const pdfBuffer = await client.generatePdf(pdfOptions);
      console.log(`✅ PDF generated successfully! Size: ${(pdfBuffer as Buffer).byteLength || (pdfBuffer as ArrayBuffer).byteLength} bytes`);
    } else {
      console.log('ℹ️ No templates found in account.');
    }

    // 6. List History Records
    console.log('📜 Fetching Invoice History...');
    const historyResponse = await client.listHistory({ page: 1, limit: 5 });
    console.log(`Total history records: ${historyResponse.total}`);

  } catch (error) {
    // 7. Structured Error Handling
    if (error instanceof AuthenticationError) {
      console.error('🔒 Authentication Failed:', error.message);
    } else if (error instanceof RateLimitError) {
      console.error(`⏳ Rate Limit Exceeded. Retry after: ${error.retryAfter || 'unknown'} seconds`);
    } else if (error instanceof ValidationError) {
      console.error('❌ Validation Error:', error.message, error.validationDetails);
    } else if (error instanceof ApiError) {
      console.error(`🚨 API Error [${error.statusCode}]:`, error.message, `Request ID: ${error.requestId || 'N/A'}`);
    } else {
      console.error('⚠️ Unexpected Error:', error);
    }
  }
}

if (require.main === module) {
  main();
}
