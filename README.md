# Invoice Builder SDK 🚀

[![NPM Version](https://img.shields.io/npm/v/invoice-builder-sdk.svg?style=flat-back)](https://www.npmjs.com/package/invoice-builder-sdk)
[![License](https://img.shields.io/npm/l/invoice-builder-sdk.svg?style=flat-back)](https://github.com/invoice-builder/invoice-builder-open-api/blob/main/LICENSE)
[![Bundle Size](https://img.shields.io/bundlephobia/min/invoice-builder-sdk?style=flat-badge)](https://bundlephobia.com/package/invoice-builder-sdk)
[![TypeScript Support](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat-back)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-back)](https://github.com/invoice-builder/invoice-builder-open-api/pulls)

A modern, ultra-lightweight, and zero-dependency TypeScript/JavaScript client library for the **Invoice Builder Open API**. Seamlessly integrate dynamic PDF/PNG invoice generation, historical auditing, and custom template schemas into any JS runtime (Node.js, Browsers, Cloudflare Workers, Vercel Edge, Bun, Deno).

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Authentication & Configuration](#authentication--configuration)
- [Getting Started](#getting-started)
  - [ESM / TypeScript](#esm--typescript)
  - [CommonJS / JavaScript](#commonjs--javascript)
- [API Reference](#api-reference)
  - [`listTemplates`](#listtemplatesoptions)
  - [`getTemplateFields`](#gettemplatefieldsoptions)
  - [`listHistory`](#listhistoryoptions)
  - [`generatePdf`](#generatepdfpayload)
- [Error Handling](#error-handling)
- [Advanced Usage](#advanced-usage)
  - [Vercel Edge & Cloudflare Workers](#vercel-edge--cloudflare-workers)
  - [Express / Fastify PDF Streaming](#express--fastify-pdf-streaming)
- [License](#license)

---

## Features

- 📦 **Dual-Package Architecture**: Out-of-the-box support for both ES Modules (`import`) and CommonJS (`require`).
- ⚡ **Zero External Dependencies**: Built entirely on top of the native `fetch` API for maximum speed, security, and low memory footprints.
- 🔒 **Type-Safe Out of the Box**: Ships with comprehensive, strict TypeScript typings mirroring backend schemas (`Invoice`, `InvoiceTemplate`, `ComponentConfig`).
- 🛠️ **Environment-Agnostic**: Compatible with Node.js 18+, Edge/Serverless functions, and modern browsers.
- 📦 **Multiple File Packaging**: Built-in support to compile up to two templates and return a unified ZIP archive.

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

The `InvoiceBuilder` class is initialized with a configuration object:

```typescript
import { InvoiceBuilder } from "invoice-builder-sdk";

const client = new InvoiceBuilder({
  apiKey: "ib_your_api_key_here",
  environment: "sandbox", // Optional: by default "production"
});
```

### Configuration Options

| Option        | Type                        | Required | Environment Variable Fallback      | Description                                                                                                                                |
| ------------- | --------------------------- | -------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `apiKey`      | `string`                    | Yes      | `INVOICE_BUILDER_API_KEY`          | Your project secret API key starting with `ib_`.                                                                                           |
| `environment` | `'production' \| 'sandbox'` | No       | `INVOICE_BUILDER_ENV` / `NODE_ENV` | Target environment. Maps to: <br>- `production`: `https://api.invoicingbuilder.com`<br>- `sandbox`: `https://api.dev.invoicingbuilder.com` |

---

## Getting Started

### ESM / TypeScript

```typescript
import { InvoiceBuilder, InvoiceTemplate } from "invoice-builder-sdk";

const client = new InvoiceBuilder(); // Implicitly pulls INVOICE_BUILDER_API_KEY from environment

async function listAllTemplates() {
  const response = await client.listTemplates();
  response.items.forEach((item) => {
    console.log(`Template ID: ${item.id} | Name: ${item.template.name}`);
  });
}
```

### CommonJS / JavaScript

```javascript
const { InvoiceBuilder } = require("invoice-builder-sdk");

const client = new InvoiceBuilder({ apiKey: "ib_your_api_key" });

client.listHistory({ page: 1, limit: 10 }).then((history) => {
  console.log(`Retrieved ${history.items.length} historic invoices.`);
});
```

---

## API Reference

### `listTemplates(options?: ListOptions)`

Retrieves a paginated list of invoice templates associated with your account.

- **Request Options (`ListOptions`)**:
  - `page` (optional): `number` - The page index (starts at 1).
  - `limit` (optional): `number` - Number of templates per page.
- **Returns**: `Promise<PaginatedResponse<InvoiceTemplateItem>>`

```typescript
const templates = await client.listTemplates({ page: 1, limit: 5 });
```

### `getTemplateFields(options)`

Fetches all editable placeholder fields and dynamic components inside a specific template or history item. Great for building dynamic user forms.

- **Request Options**:
  - `templateId` (optional): `string` - The template ID to retrieve fields from.
  - `historyId` (optional): `string` - Retrieve fields as they were filled in a past generation.
- **Returns**: `Promise<TemplateFieldsResponse>`

```typescript
const fieldMeta = await client.getTemplateFields({ templateId: "freelance" });
console.log(fieldMeta.fields); // Array of fields with label, type, and identifier
```

### `listHistory(options?: ListOptions)`

Retrieves a paginated log of all previously generated invoices and transaction logs.

- **Request Options (`ListOptions`)**:
  - `page` (optional): `number`
  - `limit` (optional): `number`
- **Returns**: `Promise<PaginatedResponse<HistoryItem>>`

```typescript
const auditTrail = await client.listHistory({ page: 1, limit: 20 });
```

### `generatePdf(payload)`

Generates high-fidelity PDF/PNG files. Supports single generation or multi-document ZIP archival.

- **Request Payload**:
  - `GeneratePdfOptions` (Object): Generates a single PDF or PNG. Returns `Buffer` (Node.js) or `ArrayBuffer` (Browser).
  - `GeneratePdfOptions[]` (Array): Generates up to 2 invoices concurrently. Returns a `ZIP` buffer.
- **Returns**: `Promise<Buffer | ArrayBuffer>`

```typescript
// Single Generation
const pdfBuffer = await client.generatePdf({
  templateId: "freelance",
  format: "pdf",
  fields: {
    invoiceNumber: "INV-0092",
    billTo: "Client Co.",
    table: [{ description: "Development Services", quantity: 10, rate: 100 }],
  },
});
```

---

## Dynamic PDF Mapping Guide

When generating documents via `generatePdf`, you pass a custom `fields` payload object mapping content to the template's placeholders. The tables below show how the API processes mapping keys and translates component types.

### Field Mapping Rules

When matching a key inside the `fields` object, the API searches and resolves template components in this priority order:

| Priority | Match Target       | Example Key     | Resolution Rule                                                             |
| :------: | :----------------- | :-------------- | :-------------------------------------------------------------------------- |
|  **1**   | **Component ID**   | `billTo-171829` | Always unique and targetable.                                               |
|  **2**   | **Component Type** | `notes`         | Matches the component if it is the only component of that type on the page. |
|  **3**   | **Custom Label**   | `PO Number`     | Matches the custom label text defined inside the template builder.          |

---

### Handling Component Types

Each component type expects values to be formatted according to these rules:

| Component Type                   | Payload / Value Rules                                                                                                                                   | Example Payload Value                                  |
| :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------- |
| **Text / Textareas**             | Provide a direct string value. Use `\n` for line breaks.                                                                                                | `"billTo": "Client Corp\n123 Innovation Drive"`        |
| **Dates**                        | Provide a string date value.                                                                                                                            | `"dueDate": "2026-06-30"`                              |
| **Logo & Signature**             | Provide a direct, public URL pointing to the image.                                                                                                     | `"logo": "https://example.com/logo.png"`               |
| **Amount Paid**                  | Provide a string value of paid amount.                                                                                                                  | `"amountPaid": "150.00"`                               |
| **Taxes / Discounts / Shipping** | Overwrite values using their id, type, or label inside the fields object.                                                                               | `"discount": "10"`                                     |
| **Table**                        | Pass an array of objects representing the rows. The table subtotal, taxes/discounts, and final balance will be automatically calculated on the backend. | See table structure in the full payload example below. |

---

### Complete Multi-Template Payload Example

The following example shows a batch of two templates (which generates a ZIP archive) showing custom headers, dates, discounts, amount paid, and table rows:

```typescript
const zipBuffer = await client.generatePdf([
  {
    templateId: "e7184fdc-838a-4766-b484-d7f6fcb44ebb",
    format: "pdf",
    fields: {
      invoiceNumber: "INV-2026-001",
      billTo: "Client Corp\n123 Innovation Drive\nNew York, NY",
      shipTo: "Buyyer Corp\n789 Team Invoice Drive\nSan Francisco, California",
      dueDate: "2026-06-30",
      amountPaid: "50.00",
      discount: "10",
      table: [
        {
          description: "Software Engineering Services",
          quantity: 40,
          rate: 85.0,
          amountPaid: 3400,
        },
        {
          description: "Cloud Deployment Setup",
          quantity: 1,
          rate: 500.0,
          amountPaid: 500,
        },
      ],
    },
  },
  {
    templateId: "e7184fdc-838a-4766-b484-d7f6fcb44ebb",
    format: "pdf",
    fields: {
      invoiceNumber: "INV-2026-001",
      billTo: "Client Corp\n123 Innovation Drive\nNew York, NY",
      shipTo: "Buyyer Corp\n789 Team Invoice Drive\nSan Francisco, California",
      dueDate: "2026-06-30",
      amountPaid: "50.00",
      discount: "10",
      table: [
        {
          description: "Software Engineering Services1",
          quantity: 40,
          rate: 85.0,
          amountPaid: 3400,
        },
        {
          description: "Cloud Deployment Setup1",
          quantity: 1,
          rate: 500.0,
          amountPaid: 500,
        },
      ],
    },
  },
]);
```

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

## License

This project is licensed under the MIT License. See [LICENSE](https://github.com/invoice-builder/invoice-builder-open-api/blob/main/LICENSE) for details.
