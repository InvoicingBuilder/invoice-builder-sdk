# Invoice Builder SDK 🚀

[![NPM Version](https://img.shields.io/npm/v/invoice-builder-sdk.svg?style=flat)](https://www.npmjs.com/package/invoice-builder-sdk)
[![License](https://img.shields.io/npm/l/invoice-builder-sdk.svg?style=flat)](https://github.com/invoice-builder/invoice-builder-open-api/blob/main/LICENSE)
[![Bundle Size](https://img.shields.io/bundlephobia/min/invoice-builder-sdk?style=flat-badge)](https://bundlephobia.com/package/invoice-builder-sdk)
[![TypeScript Support](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat-back)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-back)](https://github.com/invoice-builder/invoice-builder-open-api/pulls)

A modern, ultra-lightweight, and zero-dependency TypeScript/JavaScript client library for the **Invoice Builder Open API**. Seamlessly integrate dynamic PDF/PNG invoice generation, historical auditing, and custom template schemas into any JS runtime (Node.js, Browsers, Cloudflare Workers, Vercel Edge, Bun, Deno).

The client library helps you connect directly with the Invoice Builder API to generate documents on the fly without storing any sensitive billing data locally.

### Key Use Cases
* **Automated Customer Billing**: Generate professional PDF/PNG invoices dynamically from your e-commerce or SaaS checkout flows.
* **VAT & Tax Compliance**: Easily produce tax-compliant invoices with line items, tax percentage calculations, and multi-currency formats.
* **Custom Dynamic Forms**: Fetch editable template placeholder fields to build dynamic form inputs for your frontend users.
* **Historic Auditing & Records**: Search and retrieve past invoice data and API logs.
* **High-Volume Invoicing**: Package and compile multiple invoices concurrently into a unified ZIP archive.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Authentication & Configuration](#authentication--configuration)
- [Getting Started & Examples](#getting-started--examples)
  - [1. Simple Invoice](#1-simple-invoice)
  - [2. VAT & Tax Invoice](#2-vat--tax-invoice)
  - [3. Custom Template Fields](#3-custom-template-fields)
  - [4. Multi-Template Batch Generation (ZIP)](#4-multi-template-batch-generation-zip)
- [Dynamic PDF Mapping Guide](#dynamic-pdf-mapping-guide)
  - [Field Mapping Rules](#field-mapping-rules)
  - [Handling Component Types](#handling-component-types)
- [API Reference](#api-reference)
  - [Class: `InvoiceBuilder`](#class-invoicebuilder)
- [Error Handling](#error-handling)
- [Advanced Usage](#advanced-usage)
  - [Vercel Edge & Cloudflare Workers](#vercel-edge--cloudflare-workers)
  - [Express / Fastify PDF Streaming](#express--fastify-pdf-streaming)
- [Support & Feedback](#support--feedback)
- [License](#license)

---

## Features

* 📦 **Dual-Package Architecture**: Out-of-the-box support for both ES Modules (`import`) and CommonJS (`require`).
* ⚡ **Zero External Dependencies**: Built entirely on top of the native `fetch` API for maximum speed, security, and low memory footprints.
* 🔒 **Type-Safe Out of the Box**: Ships with comprehensive, strict TypeScript typings mirroring backend schemas (`Invoice`, `InvoiceTemplate`, `ComponentConfig`).
* 🛠️ **Environment-Agnostic**: Compatible with Node.js 18+, Edge/Serverless functions, and modern browsers.
* 📦 **Multiple File Packaging**: Built-in support to compile up to two templates and return a unified ZIP archive.

---

## Installation

Install via npm:

```bash
npm install invoice-builder-sdk
```

Or via yarn:

```bash
yarn add invoice-builder-sdk
```

Or via pnpm:

```bash
pnpm add invoice-builder-sdk
```

---

## Authentication & Configuration

To start generating invoices, you need to instantiate the `InvoiceBuilder` class. It can be initialized with an optional configuration object or will automatically fall back to environment variables.

```typescript
import { InvoiceBuilder } from "invoice-builder-sdk";

const client = new InvoiceBuilder({
  apiKey: "ib_your_api_key_here",
  environment: "sandbox", // Optional: "production" (default) or "sandbox"
});
```

### Configuration Options

| Option | Type | Required | Environment Fallback | Description |
| :--- | :--- | :--- | :--- | :--- |
| `apiKey` | `string` | **Yes** | `INVOICE_BUILDER_API_KEY` | Your project secret API key starting with `ib_`. |
| `environment` | `'production' \| 'sandbox'` | No | `INVOICE_BUILDER_ENV` / `NODE_ENV` | Target environment. Maps to: <br>- `production`: `https://api.invoicingbuilder.com`<br>- `sandbox`: `https://api.dev.invoicingbuilder.com` |

---

## Getting Started & Examples

Below are practical JavaScript and TypeScript examples showing how to use the SDK for various invoicing workflows.

### 1. Simple Invoice
Generate a basic PDF invoice using a predefined template.

```typescript
import { InvoiceBuilder } from "invoice-builder-sdk";
import * as fs from "fs/promises";

// Assumes INVOICE_BUILDER_API_KEY is set in environment
const client = new InvoiceBuilder({
  apiKey: "ib_your_api_key_here",
  environment: "sandbox",
});

async function generateSimpleInvoice() {
  try {
    const pdfBuffer = await client.generatePdf({
      templateId: "freelance-template-id",
      format: "pdf",
      fields: {
        invoiceNumber: "INV-2026-001",
        billTo: "Acme Corp\n123 Business Rd\nSan Francisco, CA",
        date: "2026-07-09",
        table: [
          {
            description: "Consulting Services",
            quantity: 5,
            rate: 150.0,
          }
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

```typescript
import { InvoiceBuilder } from "invoice-builder-sdk";
import * as fs from "fs/promises";

const client = new InvoiceBuilder({
  apiKey: "ib_your_api_key_here",
  environment: "sandbox",
});

async function generateVatInvoice() {
  try {
    const pdfBuffer = await client.generatePdf({
      templateId: "freelance-template-id",
      format: "pdf",
      fields: {
        invoiceNumber: "INV-2026-002",
        billTo: "Nikolaus Ltd\nVAT ID: DE123456789\nBerlin, Germany",
        shipTo: "Foster Moen\nVAT ID: FR987654321\nParis, France",
        date: "2026-07-09",
        dueDate: "2026-08-09",
        tax: "8",           // 8% VAT
        discount: "10",      // Flat discount amount
        shipping: "15",      // Shipping cost
        amountPaid: "50",    // Partial payment details
        payment_terms: "NET 30",
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
      },
    });

    await fs.writeFile("invoice.vat.pdf", Buffer.from(pdfBuffer));
    console.log("VAT Invoice generated successfully!");
  } catch (error) {
    console.error("Error:", error);
  }
}

generateVatInvoice();
```

### 3. Custom Template Fields
Custom templates built with the visual template designer may have custom placeholders. You can match and target them directly using their custom labels or labels you define inside the builder.

```typescript
import { InvoiceBuilder } from "invoice-builder-sdk";

const client = new InvoiceBuilder({
  apiKey: "ib_your_api_key_here",
  environment: "sandbox",
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
      // Match by custom label or ID directly
      "PO Number": "PO-99281A",
      "Account Number": "ACT-77162",
      table: [
        { description: "Item A", quantity: 2, rate: 50.0 }
      ]
    }
  });
}
```

### 4. Multi-Template Batch Generation (ZIP)
Generate multiple invoices concurrently in a single API call. The SDK will return a ZIP archive containing all documents.

```typescript
import { InvoiceBuilder } from "invoice-builder-sdk";
import * as fs from "fs/promises";

const client = new InvoiceBuilder({
  apiKey: "ib_your_api_key_here",
  environment: "sandbox",
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
```

---

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

## API Reference

### Class: `InvoiceBuilder`

#### `constructor(config?: InvoiceBuilderConfig)`
Creates an instance of the `InvoiceBuilder` client.

* **Parameters**:
  * `config` (optional): `InvoiceBuilderConfig`
    * `apiKey` (optional): `string` - Override secret key.
    * `environment` (optional): `'production' | 'sandbox'` - Override API base URL environment.

---

#### `listTemplates(options?: ListOptions)`
Retrieves a paginated list of invoice templates associated with your account.

* **Parameters**:
  * `options` (optional): `ListOptions`
    * `page` (optional): `number` - Page index starting at 1.
    * `limit` (optional): `number` - Number of templates per page.
* **Returns**: `Promise<PaginatedResponse<InvoiceTemplateItem>>`

---

#### `getTemplateFields(options)`
Fetches all editable placeholder fields and dynamic components inside a specific template or history item. Great for building dynamic user forms.

* **Parameters**:
  * `options`: `{ templateId?: string; historyId?: string }`
    * `templateId` (optional): `string`
    * `historyId` (optional): `string`
* **Returns**: `Promise<TemplateFieldsResponse>`

---

#### `listHistory(options?: ListOptions)`
Retrieves a paginated log of all previously generated invoices and transaction logs.

* **Parameters**:
  * `options` (optional): `ListOptions`
    * `page` (optional): `number`
    * `limit` (optional): `number`
* **Returns**: `Promise<PaginatedResponse<HistoryItem>>`

---

#### `generatePdf(payload)`
Generates high-fidelity PDF/PNG files. Supports single generation or multi-document ZIP archival.

* **Parameters**:
  * `payload`: `GeneratePdfOptions | GeneratePdfOptions[]`
    * `GeneratePdfOptions` (Object): Generates a single PDF or PNG. Returns `Buffer` (Node.js) or `ArrayBuffer` (Browser).
    * `GeneratePdfOptions[]` (Array): Generates up to 2 invoices concurrently. Returns a `ZIP` buffer.
* **Returns**: `Promise<Buffer | ArrayBuffer>`

---

## Error Handling

Errors returned by the Invoice Builder API are parsed and thrown as standard JavaScript `Error` objects containing descriptive server-side messages (such as validation warnings).

```typescript
try {
  await client.generatePdf({
    templateId: "non-existent",
    format: "pdf",
  });
} catch (error) {
  if (error instanceof Error) {
    console.error("API Error:", error.message);
    // e.g. "Template not found" or validation array logs
  }
}
```

---

## Advanced Usage

### Vercel Edge & Cloudflare Workers

Since the SDK uses native `fetch` and does not bind node-specific network or filesystem APIs, it runs natively on edge compute runtimes:

```typescript
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

```javascript
const express = require("express");
const { InvoiceBuilder } = require("invoice-builder-sdk");
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

If you encounter any bugs, have feature requests, or need help with integrations, please open an issue in the [GitHub issue tracker](https://github.com/invoice-builder/invoice-builder-open-api/issues).

---

## License

This project is licensed under the MIT License. See [LICENSE](https://github.com/invoice-builder/invoice-builder-open-api/blob/main/LICENSE) for details.
