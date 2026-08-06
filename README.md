# Invoice Builder SDK 🚀

[![NPM Version](https://img.shields.io/npm/v/@invoicing-builder/invoice-builder-sdk.svg?style=flat)](https://www.npmjs.com/package/@invoicing-builder/invoice-builder-sdk)
[![TypeScript Support](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat-back)](https://www.typescriptlang.org/)
[![NPM Downloads](https://img.shields.io/npm/dm/@invoicing-builder/invoice-builder-sdk.svg?style=flat)](https://www.npmjs.com/package/@invoicing-builder/invoice-builder-sdk)
[![GitHub Issues](https://img.shields.io/github/issues/InvoicingBuilder/invoice-builder-sdk.svg?style=flat)](https://github.com/InvoicingBuilder/invoice-builder-sdk/issues)
[![GitHub Stars](https://img.shields.io/github/stars/InvoicingBuilder/invoice-builder-sdk.svg?style=flat)](https://github.com/InvoicingBuilder/invoice-builder-sdk/stargazers)
[![Last Commit](https://img.shields.io/github/last-commit/InvoicingBuilder/invoice-builder-sdk.svg?style=flat)](https://github.com/InvoicingBuilder/invoice-builder-sdk/commits/main)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-back)](https://github.com/InvoicingBuilder/invoice-builder-sdk/pulls)

A modern, production-grade, and lightweight TypeScript/JavaScript client library for the **Invoice Builder**. Seamlessly integrate dynamic PDF/PNG invoice generation, structured error handling, historical auditing, and custom template schemas into any JS runtime (Node.js, Browsers, Cloudflare Workers, Vercel Edge, Bun, Deno).

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Authentication & Configuration](#authentication--configuration)
- [API Reference](#api-reference)
  - [`validateKey()`](#validatekey)
  - [`listTemplates(options?, requestOptions?)`](#listtemplatesoptions-requestoptions)
  - [`getTemplateFields(options, requestOptions?)`](#gettemplatefieldsoptions-requestoptions)
  - [`listHistory(options?, requestOptions?)`](#listhistoryoptions-requestoptions)
  - [`generatePdf(payload, requestOptions?)`](#generatepdfpayload-requestoptions)
      - [1. Simple Invoice](#1-simple-invoice)
      - [2. VAT & Tax Invoice](#2-vat--tax-invoice)
      - [3. Complete Detailed Invoice](#3-complete-detailed-invoice)
      - [4. Custom Template Fields](#4-custom-template-fields)
      - [5. Multi-Template Batch Generation (ZIP)](#5-multi-template-batch-generation-zip)
- [How to Find Your Template ID](#how-to-find-your-template-id)
- [Dynamic PDF Mapping Guide](#dynamic-pdf-mapping-guide)
  - [Field Mapping Rules](#field-mapping-rules)
  - [Handling Component Types](#handling-component-types)
- [Error Handling & Taxonomy](#error-handling--taxonomy)
- [Rate Limit Handling](#rate-limit-handling)
- [Getting Started & Examples](#getting-started--examples)
- [Advanced Usage](#advanced-usage)

---

## Features

* 📦 **Dual-Package Architecture**: Native support for ES Modules (`import`) and CommonJS (`require`).
* ⚡ **Zero External Dependencies**: Built on top of native `fetch` for speed, security, and low memory footprint.
* 🔒 **Type-Safe Out of the Box**: Comprehensive TypeScript typings mirroring backend schemas.
* ⏳ **Configurable Request Timeouts**: Support for configurable timeouts via `AbortController` and per-request signals.
* 🚨 **Structured Custom Error Hierarchy**: Explicit error classes (`AuthenticationError`, `RateLimitError`, `ValidationError`, `NetworkError`, `TimeoutError`, etc.) with request ID tracking.
* 🛠️ **Cross-Platform**: Node.js 18+, Vercel Edge, Cloudflare Workers, Bun, Deno, and modern browsers.

---

## Installation

```
npm i @invoicing-builder/invoice-builder-sdk
# or
yarn add @invoicing-builder/invoice-builder-sdk
# or
pnpm add @invoicing-builder/invoice-builder-sdk
```

---

## Authentication & Configuration

Instantiate `InvoiceBuilder` with a configuration object or rely on `INVOICE_BUILDER_API_KEY` environment variable.

```
import { InvoiceBuilder } from "@invoicing-builder/invoice-builder-sdk";

const client = new InvoiceBuilder({
  apiKey: "ib_your_api_key_here",
});
```

### Configuration Options

| Option | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `apiKey` | `string` | `yes` | Secret API key starting with `ib_`. |

---

## API Reference

### `validateKey()`
Verifies that your API key is valid and active. Returns key metadata.

```
import { InvoiceBuilder } from "@invoicing-builder/invoice-builder-sdk";

const client = new InvoiceBuilder({
  apiKey: "ib_your_api_key_here",
});

const keyInfo = await client.validateKey();
console.log(keyInfo.valid); // true
console.log(keyInfo.keyPrefix); // "ib_live"
```

### `listTemplates(options?, requestOptions?)`
Retrieves a paginated list of invoice templates associated with your account.

```
import { InvoiceBuilder } from "@invoicing-builder/invoice-builder-sdk";

const client = new InvoiceBuilder({
  apiKey: "ib_your_api_key_here",
});

const templates = await client.listTemplates({ page: 1, limit: 10 });
console.log(`Total templates: ${templates.total}`);
```

### `getTemplateFields(options, requestOptions?)`
Fetches editable placeholder fields inside a specific template or history item.

```
import { InvoiceBuilder } from "@invoicing-builder/invoice-builder-sdk";

const client = new InvoiceBuilder({
  apiKey: "ib_your_api_key_here",
});

const fieldsRes = await client.getTemplateFields({ templateId: "template-id-123" });
console.log(fieldsRes.fields);
```

### `listHistory(options?, requestOptions?)`
Retrieves a paginated log of all previously generated invoices and transaction logs.

```
import { InvoiceBuilder } from "@invoicing-builder/invoice-builder-sdk";

const client = new InvoiceBuilder({
  apiKey: "ib_your_api_key_here",
});

const history = await client.listHistory({ page: 1, limit: 10 });
```

### `generatePdf(payload, requestOptions?)`
Generates high-fidelity PDF/PNG files. Accepts a single mapping object or an array of up to 2 mapping objects (which returns a ZIP archive).

### 1. Simple Invoice
Generate a basic PDF invoice using a predefined template.

```
import { InvoiceBuilder } from "@invoicing-builder/invoice-builder-sdk";
import * as fs from "fs/promises";

const client = new InvoiceBuilder({
  apiKey: "ib_your_api_key_here",
});

async function generateSimpleInvoice() {
  try {
    const pdfBuffer = await client.generatePdf({
      templateId: "template-id",
      format: "pdf",
      fields: {
        invoiceNumber: "INV-2026-001",
        billTo: "Acme Globel Corporation\n123 Business Rd\nSan Francisco, CA",
        shipTo: "Stark International Corporation\n745 New York street,\nNew York, US",
        date: "2026-07-09",
        dueDate: "2026-07-30",
        poNumber: "PO-2026-201",
        tax: 3.5,
        discount: 10,
        shipping: 9.99,
        addLogo: "https://img.magnific.com/free-vector/bird-colorful-gradient-design-vector_343694-2506.jpg?t=st=1786000770~exp=1786004370~hmac=df25b64f3ad741cd8775c5e82f5dc3f96f593e854401208b0b4b662437ae5f8e&w=1480",
        terms: "• All prices are subject to change without notice\n• Goods remain our property until paid in full\n• Returns must be authorized and in original condition\n• Warranty covers manufacturing defects only",
        notes: "• Please include invoice number in payment reference\n• All amounts are in USD unless otherwise specified\n• Contact sales@company.com for any queries\n• Thank you for your business!",
        signature: "https://img.magnific.com/premium-vector/black-white-photo-signature-from-companys-company_731129-2266.jpg?w=740",
        table: [
          {
            description: "Consulting Services",
            quantity: 5,
            rate: 150.0,
          },
          {
            description: "Enterprise SaaS API License",
            quantity: 1,
            rate: 1200
          },
          {
            description: "Schema Customization Support",
            quantity: 5,
            rate: 150
          },
        ],
      },
    });

    // Save the PDF locally
    await fs.writeFile("invoice.pdf", Buffer.from(pdfBuffer));
    console.log("PDF Invoice generated successfully!");
  } catch (error) {
    console.error("Failed to generate invoice:", error);
  }
}

generateSimpleInvoice();
```

### 2. VAT & Tax Invoice
Generate a compliant VAT invoice by adding tax titles, percentages, discounts, and payment terms.

```
import { InvoiceBuilder } from "@invoicing-builder/invoice-builder-sdk";
import * as fs from "fs/promises";

const client = new InvoiceBuilder({
  apiKey: "ib_your_api_key_here",
});

async function generateVatInvoice() {
  try {
    const pdfBuffer = await client.generatePdf({
      templateId: "template-id",
      format: "pdf",
      fields: 
        invoiceNumber: "INV-2026-002",
        billTo: "Nikolaus Ltd\nVAT ID: DE123456789\nBerlin, Germany",
        shipTo: "Foster Moen\nVAT ID: FR987654321\nParis, France",
        date: "2026-07-09",
        dueDate: "2026-08-09",
        tax: 8,           // 8% VAT
        discount: 10,      // 10% discount amount
        shipping: 15,      // Shipping cost
        amountPaid: 50,    // Partial payment details
        payment_terms: "NET 30",
        addLogo: "https://img.magnific.com/free-vector/bird-colorful-gradient-design-vector_343694-2506.jpg?t=st=1786000770~exp=1786004370~hmac=df25b64f3ad741cd8775c5e82f5dc3f96f593e854401208b0b4b662437ae5f8e&w=1480",
        terms: "• All prices are subject to change without notice\n• Goods remain our property until paid in full\n• Returns must be authorized and in original condition\n• Warranty covers manufacturing defects only",
        notes: "• Please include invoice number in payment reference\n• All amounts are in USD unless otherwise specified\n• Contact sales@company.com for any queries\n• Thank you for your business!",
        signature: "https://img.magnific.com/premium-vector/black-white-photo-signature-from-companys-company_731129-2266.jpg?w=740",
        notes: "Thank you for doing business with us!",
        terms: "Payment is due within 30 days of invoice date.",
        table: [
          {
            description: "Software Engineering Services",
            quantity: 40,
            rate: 85.00,
          },
          {
            description: "Cloud Deployment Infrastructure",
            quantity: 1,
            rate: 500.00,
          }
        ],
      ,
    });

    await fs.writeFile("invoice.vat.pdf", Buffer.from(pdfBuffer));
    console.log("VAT Invoice generated successfully!");
  } catch (error) {
    console.error("Error:", error);
  }
}

generateVatInvoice();
```

### 3. Complete Detailed Invoice
Generate a detailed PDF invoice using a comprehensive set of options including table items, custom fields like "PO Number", signature, logo, taxes, discounts, and shipping.

```
import { InvoiceBuilder } from "@invoicing-builder/invoice-builder-sdk";
import * as fs from "fs/promises";

const client = new InvoiceBuilder({
  apiKey: "ib_your_api_key_here",
});

async function generateCompleteInvoice() {
  try {
    const pdfBuffer = await client.generatePdf({
      templateId: "567f5aa8-a0dc-4941-b782-bbcc536054f1",
      format: "pdf",
      fields: {
        invoiceNumber: "INV-2026-9021",
        date: "2026-07-11",
        dueDate: "2026-08-11",
        tax: 8,
        discount: 26,
        shipping: 25,
        amountPaid: 0,
        notes: "Thank you for choosing Antigravity Labs. Please transfer payment within 30 days.",
        terms: "Net 30 days. Payments accepted via Bank Wire or Credit Card.",
        addLogo: "https://img.magnific.com/free-vector/bird-colorful-gradient-design-vector_343694-2506.jpg?t=st=1786000770~exp=1786004370~hmac=df25b64f3ad741cd8775c5e82f5dc3f96f593e854401208b0b4b662437ae5f8e&w=1480",
        signature: "https://img.magnific.com/premium-vector/black-white-photo-signature-from-companys-company_731129-2266.jpg?w=740",
        billTo: "Foster Moen\nNikolaus Group Inc\n456 Innovation Boulevard\nBerlin, 10117\nGermany\nPhone: +49 30 12345678\nEmail: billing@nikolaus-group.de",
        shipTo: "Antigravity Labs LLC\n100 Orbit Way, Suite 400\nSan Francisco, CA 94107\nUnited States\nPhone: +1 (415) 555-0190\nEmail: finance@antigravitylabs.io\nTax ID: US-99-8877665",
        table: [
          {
            description: "Quantum Engineering Services (Hours)",
            quantity: 37.5,
            rate: 125,
          },
          {
            description: "Cloud deployment & container orchestration (SaaS)",
            quantity: 1,
            rate: 850,
          },
          {
            description: "Enterprise support retainer (Quarterly)",
            quantity: 1,
            rate: 120,
          },
        ],
        "PO Number": "PO-99882",
      },
    });

    await fs.writeFile("complete-invoice.pdf", Buffer.from(pdfBuffer));
    console.log("Detailed PDF Invoice generated successfully!");
  } catch (error) {
    console.error("Failed to generate detailed invoice:", error);
  }
}

generateCompleteInvoice();
```

### 4. Custom Template Fields
Custom templates built with the visual template designer may have custom placeholders. You can match and target them directly using their custom labels or labels you define inside the builder.

```
import { InvoiceBuilder } from "@invoicing-builder/invoice-builder-sdk";

const client = new InvoiceBuilder({
  apiKey: "ib_your_api_key_here",
});

async function checkAndFillTemplate() {
  // 1. Fetch editable fields metadata to see what custom placeholders exist
  const meta = await client.getTemplateFields({ templateId: "custom-billing-id" });
  console.log("Editable Fields:", meta.fields);

  // Example return: [{ id: "field_928", label: "PO Number", type: "text" }]

  // 2. Generate PDF using custom labels directly in fields payload
  const pdfBuffer = await client.generatePdf({
    templateId: "custom-billing-id",
    format: "pdf",
    fields: {
      invoiceNumber: "INV-100",
      "PO Number": "PO-99281A",
      "Account Number": "ACT-77162",
      table: [
        { description: "Item A", quantity: 2, rate: 50.0 }
      ]
    }
  });
}
```

### 5. Multi-Template Batch Generation (ZIP)
Generate multiple invoices concurrently in a single API call. The SDK will return a ZIP archive containing all documents.

```
import { InvoiceBuilder } from "@invoicing-builder/invoice-builder-sdk";
import * as fs from "fs/promises";

const client = new InvoiceBuilder({
  apiKey: "ib_your_api_key_here",
});

async function generateBatch() {
  try {
    const zipBuffer = await client.generatePdf([
      {
        templateId: "template-a-id",
        format: "pdf",
        fields: {
          invoiceNumber: "INV-BATCH-01",
          billTo: "Client One",
          table: [{ description: "Consulting", quantity: 10, rate: 100 }]
        }
      },
      {
        templateId: "template-b-id",
        format: "pdf",
        fields: {
          invoiceNumber: "INV-BATCH-02",
          billTo: "Client Two",
          table: [{ description: "Design work", quantity: 5, rate: 120 }]
        }
      }
    ]);

    await fs.writeFile("invoices.zip", Buffer.from(zipBuffer));
    console.log("ZIP archive saved successfully!");
  } catch (error) {
    console.error("Batch generation failed:", error);
  }
}

generateBatch();
```

---

## How to Find Your Template ID

To generate invoices, you need a `templateId`. You can obtain this in two ways:

### 1. Via the Web Dashboard
1. Log in to your **Invoicing Builder** account.
2. Go to the **Templates** section.
3. Click on the template you want to use.
4. Copy the unique ID from the template details panel or directly from the browser URL:
   `https://invoicingbuilder.com/templates/567f5aa8-a0dc-4941-b782-bbcc536054f1` (where `567f5aa8-a0dc-4941-b782-bbcc536054f1` is your `templateId`).

### 2. Programmatically Via the SDK
You can query all available templates on your account using the `listTemplates` API:

```
import { InvoiceBuilder } from "@invoicing-builder/invoice-builder-sdk";

const client = new InvoiceBuilder({
  apiKey: "ib_your_api_key_here",
});

async function findTemplates() {
  try {
    const response = await client.listTemplates({ page: 1, limit: 10 });
    console.log(`Total templates: ${response.total}`);
    
    response.items.forEach((item) => {
      console.log(`- Name: ${item.template.name}`);
      console.log(`  ID: ${item.template.id}`);
      console.log(`  Last Updated: ${item.updatedAt}`);
    });
  } catch (error) {
    console.error("Failed to list templates:", error);
  }
}

findTemplates();
```

## Dynamic PDF Mapping Guide

When generating documents via `generatePdf`, you pass a custom `fields` payload object mapping content to the template's placeholders. The tables below show how the API processes mapping keys and translates component types.

### Field Mapping Rules

When matching a key inside the `fields` object, the API searches and resolves template components in this priority order:

| Priority | Match Target | Example Key | Resolution Rule |
| :---: | :--- | :--- | :--- |
| **1** | **Component ID** | `billTo-171829` | Always unique and targetable. |
| **2** | **Component Type** | `notes` | Matches the component if it is the only component of that type on the page. |
| **3** | **Custom Label** | `PO Number` | Matches the custom label text defined inside the template builder. |

---

### Handling Component Types

Each component type expects values to be formatted according to these rules:

| Component Type | Payload / Value Rules | Example Payload Value |
| :--- | :--- | :--- |
| **Text / Textareas** | Provide a direct string value. Use `\n` for line breaks. | `"billTo": "Client Corp\n123 Innovation Drive"` |
| **Dates** | Provide a string date value. | `"dueDate": "2026-06-30"` |
| **Logo & Signature** | Provide a direct, public URL pointing to the image. | `"logo": "https://example.com/logo.png"` |
| **Amount Paid** | Provide a string value of paid amount. | `"amountPaid": "150.00"` |
| **Taxes / Discounts / Shipping** | Overwrite values using their id, type, or label inside the fields object. | `"discount": "10"` |
| **Table** | Pass an array of objects representing the rows. The table subtotal, taxes/discounts, and final balance will be automatically calculated on the backend. | See table structure in the examples above. |

---

## Error Handling & Taxonomy

All SDK errors inherit from `InvoiceBuilderError`. API errors inherit from `ApiError` and expose `statusCode`, `requestId`, and `responseBody`.

```
InvoiceBuilderError (Base Error)
├── ApiError (HTTP status code error)
│   ├── AuthenticationError (HTTP 401)
│   ├── AuthorizationError (HTTP 403)
│   ├── NotFoundError (HTTP 404)
│   ├── ValidationError (HTTP 400 / 422)
│   ├── RateLimitError (HTTP 429, retryAfter)
│   └── InternalServerError (HTTP 500 / 502 / 503 / 504)
├── NetworkError (Connection failure)
└── TimeoutError (Request timeout)
```

### Catching Errors Example

```
import {
  InvoiceBuilder,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  ApiError,
} from "@invoicing-builder/invoice-builder-sdk";

try {
  await client.generatePdf({ templateId: "invalid", format: "pdf" });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key provided.");
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limit reached. Try again after ${error.retryAfter}s.`);
  } else if (error instanceof ValidationError) {
    console.error("Invalid payload:", error.validationDetails);
  } else if (error instanceof ApiError) {
    console.error(`API Error ${error.statusCode} [Request ID: ${error.requestId}]: ${error.message}`);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

---

## Rate Limit Handling

When the API returns `HTTP 429 Too Many Requests`, the SDK throws a `RateLimitError`. The error instance parses and includes the `retryAfter` property (in seconds) extracted from the `Retry-After` response header or JSON body:

```
try {
  await client.listTemplates();
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited! Retry after ${error.retryAfter} seconds.`);
  }
}
```

---

## Getting Started & Examples

Production-ready runnable examples are located in the directory:

Run TypeScript Example:
```
npx ts-node examples/sample.ts
```

Run JavaScript Example:
```
node examples/sample.js
```

---

## Advanced Usage

### Vercel Edge & Cloudflare Workers

Since the SDK uses native `fetch` and does not bind node-specific network or filesystem APIs, it runs natively on edge compute runtimes:

```
export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  const client = new InvoiceBuilder({
    apiKey: process.env.INVOICE_BUILDER_API_KEY,
  });
  const pdfBytes = await client.generatePdf({
    templateId: "freelance",
    format: "pdf",
    fields: { invoiceNumber: "INV-EDGE" },
  });

  return new Response(pdfBytes, {
    headers: { "Content-Type": "application/pdf" },
  });
}
```

### Express / Fastify PDF Streaming

Deliver generated invoice binaries directly to users as inline downloads in web frameworks:

```
const express = require("express");
const { InvoiceBuilder } = require("@invoicing-builder/invoice-builder-sdk");
const app = express();

const client = new InvoiceBuilder();

app.get("/download-invoice", async (req, res) => {
  try {
    const pdfBuffer = await client.generatePdf({
      templateId: "freelance",
      format: "pdf",
      fields: { invoiceNumber: "INV-123" },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.listen(3000);
```

---

## Support & Feedback

If you encounter any bugs, have feature requests, or need help with integrations, please open an issue in the [GitHub issue tracker](https://github.com/InvoicingBuilder/invoice-builder-sdk/issues).