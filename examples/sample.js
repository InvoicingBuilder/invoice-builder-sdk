const {
  InvoiceBuilder,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  ApiError,
} = require("@invoicing-builder/invoice-builder-sdk");

async function main() {
  console.log("🚀 Initializing Invoice Builder SDK (JavaScript CommonJS)...");

  // Initialize Client
  const apiKey =
    "ib_test_sample_key_12345";

  const client = new InvoiceBuilder({
    apiKey,
  });

  try {
    // Validate API Key
    console.log("🔑 Validating API Key...");
    const authStatus = await client.validateKey();
    console.log(`✅ Key Valid: ${authStatus.valid}`);

    // List Templates
    console.log("📋 Fetching Templates...");
    const templates = await client.listTemplates({
      page: 1,
      limit: 10,
    });

    console.log(`Total Templates: ${templates.total}`);

    // Generate PDF
    if (templates.items?.length) {
      const templateId = templates.items[0].id;

      console.log(`⚡ Generating PDF for template ${templateId}...`);

      const buffer = await client.generatePdf({
        templateId,
        format: "pdf",
        fields: {
          invoice_number: "INV-2026-999",
          client_name: "Stark Industries",
        },
      });

      console.log(
        `✅ PDF Generated! Bytes: ${buffer.byteLength ?? buffer.length}`,
      );

      // 6. List History Records
      console.log("📜 Fetching Invoice History...");
      const historyResponse = await client.listHistory({ page: 1, limit: 5 });
      console.log(`Total history records: ${historyResponse.total}`);
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error("🔒 Authentication Error:", error.message);
    } else if (error instanceof RateLimitError) {
      console.error(
        `⏳ Rate Limit Exceeded (Retry after ${error.retryAfter ?? "N/A"}s):`,
        error.message,
      );
    } else if (error instanceof ValidationError) {
      console.error("❌ Validation Error:", error.message);
    } else if (error instanceof ApiError) {
      console.error(`🚨 API Error ${error.statusCode}:`, error.message);
    } else {
      console.error("⚠️ General Error:", error);
    }
  }
}

if (require.main === module) {
  main();
}
