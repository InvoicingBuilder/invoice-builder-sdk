# Invoice Builder SDK 🚀

[![NPM Version](https://img.shields.io/npm/v/@invoicing-builder/invoice-builder-sdk.svg?style=flat)](https://www.npmjs.com/package/@invoicing-builder/invoice-builder-sdk)
[![TypeScript Support](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat-back)](https://www.typescriptlang.org/)
[![NPM Downloads](https://img.shields.io/npm/dm/@invoicing-builder/invoice-builder-sdk.svg?style=flat)](https://www.npmjs.com/package/@invoicing-builder/invoice-builder-sdk)
[![GitHub Issues](https://img.shields.io/github/issues/InvoicingBuilder/invoice-builder-sdk.svg?style=flat)](https://github.com/InvoicingBuilder/invoice-builder-sdk/issues)
[![GitHub Stars](https://img.shields.io/github/stars/InvoicingBuilder/invoice-builder-sdk.svg?style=flat)](https://github.com/InvoicingBuilder/invoice-builder-sdk/stargazers)
[![Last Commit](https://img.shields.io/github/last-commit/InvoicingBuilder/invoice-builder-sdk.svg?style=flat)](https://github.com/InvoicingBuilder/invoice-builder-sdk/commits/main)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-back)](https://github.com/InvoicingBuilder/invoice-builder-sdk/pulls)

A lightweight TypeScript/JavaScript client library for **Invoice Builder**. Generate PDF/PNG invoices, inspect templates and history, and handle API errors in Node.js 18+, serverless and edge runtimes. The SDK also works in modern browsers, but secret API keys must only be used on the server.

---

## Table of Contents

- [Features](#features)

- [Installation](#installation)

- [Authentication & Configuration](#authentication--configuration)

- [API Reference](#api-reference)
  - [`validateKey()`](#validatekey)

  - [`listTemplates(options?)`](#listtemplatesoptions)

  - [`getTemplateFields(options)`](#gettemplatefieldsoptions)

  - [`listHistory(options?)`](#listhistoryoptions)

  - [`generatePdf(payload)`](#generatepdfpayload)
    - [1. Simple Invoice](#1-simple-invoice)

    - [2. VAT & Tax Invoice](#2-vat--tax-invoice)

    - [3. Complete Detailed Invoice](#3-complete-detailed-invoice)

    - [4. Custom Template Fields](#4-custom-template-fields)

    - [5. PNG Output](#5-png-output)
    - [6. Multi-Template Batch Generation (ZIP)](#6-multi-template-batch-generation-zip)

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

- 📦 **Dual-Package Architecture**: Native support for ES Modules (`import`) and CommonJS (`require`).

- ⚡ **Zero External Dependencies**: Built on top of native `fetch` for speed, security, and low memory footprint.

- 🔒 **Type-Safe Out of the Box**: Comprehensive TypeScript typings mirroring backend schemas.

- 🚨 **Structured Custom Error Hierarchy**: Explicit error classes (`AuthenticationError`, `RateLimitError`, `ValidationError`, `NetworkError`, `TimeoutError`, etc.) with request ID tracking.

- 🛠️ **Cross-Platform**: Node.js 18+, Vercel Edge, Cloudflare Workers, Bun, Deno, and modern browsers. Keep secret API keys out of browser bundles.

---

## Installation

```sh
npm i @invoicing-builder/invoice-builder-sdk
# or
yarn add @invoicing-builder/invoice-builder-sdk
# or
pnpm add @invoicing-builder/invoice-builder-sdk
```

---

## Authentication & Configuration

Instantiate `InvoiceBuilder` in server-side code with a configuration object or rely on the `INVOICE_BUILDER_API_KEY` environment variable. Store the key in your server environment, never in frontend code, a public environment variable, or a browser bundle. If users need to generate an invoice from a website, have the browser call your own backend endpoint, then call this SDK from that endpoint.

```js
import { InvoiceBuilder } from '@invoicing-builder/invoice-builder-sdk';

const client = new InvoiceBuilder({
  apiKey: 'ib_your_api_key_here',
});
```

### Configuration Options

| Option   | Type     | Required                                                       | Description                                                              |
| :------- | :------- | :------------------------------------------------------------- | :----------------------------------------------------------------------- |
| `apiKey` | `string` | Required unless `INVOICE_BUILDER_API_KEY` is set on the server | Secret API key starting with `ib_`. Never expose it in client-side code. |

---

## API Reference

### `validateKey()`

Verifies that your API key is valid and active. Returns key metadata.

```js
import { InvoiceBuilder } from '@invoicing-builder/invoice-builder-sdk';

const client = new InvoiceBuilder({
  apiKey: 'ib_your_api_key_here',
});

const keyInfo = await client.validateKey();

console.log(keyInfo.valid); // true
console.log(keyInfo.keyPrefix); // "ib_live"
```

### `listTemplates(options?)`

Retrieves a paginated list of invoice templates associated with your account.

```js
import { InvoiceBuilder } from '@invoicing-builder/invoice-builder-sdk';

const client = new InvoiceBuilder({
  apiKey: 'ib_your_api_key_here',
});

const templates = await client.listTemplates({ page: 1, limit: 10 });

console.log(`Total templates: ${templates.total}`);
```

### `getTemplateFields(options)`

Fetches editable placeholder fields inside a specific template or history item.

```js
import { InvoiceBuilder } from '@invoicing-builder/invoice-builder-sdk';

const client = new InvoiceBuilder({
  apiKey: 'ib_your_api_key_here',
});

const fieldsRes = await client.getTemplateFields({
  templateId: 'template-id-123',
});

console.log(fieldsRes.fields);
```

### `listHistory(options?)`

Retrieves a paginated log of all previously generated invoices and transaction logs.

```js
import { InvoiceBuilder } from '@invoicing-builder/invoice-builder-sdk';

const client = new InvoiceBuilder({
  apiKey: 'ib_your_api_key_here',
});

const history = await client.listHistory({ page: 1, limit: 10 });
```

### `generatePdf(payload)`

Generates a PDF or PNG from one mapping object, or a ZIP archive from an array of up to two mapping objects. The documented return type is `Promise<Buffer | ArrayBuffer>`: `Buffer` in Node.js and `ArrayBuffer` where Node's `Buffer` is unavailable. The output contains file bytes, not a URL or a JSON response. Node examples convert either result to a `Buffer` before saving or sending it. Use the matching MIME type: `application/pdf`, `image/png`, or `application/zip`.

The exact shape of optional per-request configuration is not shown here because it needs to be checked against the installed SDK's exported types. Check those types before adding a timeout or abort signal to an SDK call.

### 1. Simple Invoice

Generate a basic PDF invoice using a predefined template.

```js
import { InvoiceBuilder } from '@invoicing-builder/invoice-builder-sdk';
import * as fs from 'fs/promises';

const client = new InvoiceBuilder({
  apiKey: 'ib_your_api_key_here',
});

async function generateSimpleInvoice() {
  try {
    const pdfBuffer = await client.generatePdf({
      templateId: 'template-id',
      format: 'pdf',
      fields: {
        invoiceNumber: 'INV-2026-001',
        billTo: 'Acme Globel Corporation\n123 Business Rd\nSan Francisco, CA',
        shipTo:
          'Stark International Corporation\n745 New York street,\nNew York, US',
        date: '2026-07-09',
        dueDate: '2026-07-30',
        poNumber: 'PO-2026-201',
        tax: 3.5,
        discount: 10,
        shipping: 9.99,
        addLogo: 'https://example.com/logo.png',
        terms:
          '• All prices are subject to change without notice\n• Goods remain our property until paid in full\n• Returns must be authorized and in original condition\n• Warranty covers manufacturing defects only',
        notes:
          '• Please include invoice number in payment reference\n• All amounts are in USD unless otherwise specified\n• Contact sales@company.com for any queries\n• Thank you for your business!',
        signature: 'https://example.com/signature.png',
        table: [
          {
            description: 'Consulting Services',
            quantity: 5,
            rate: 150.0,
          },
          {
            description: 'Enterprise SaaS API License',
            quantity: 1,
            rate: 1200,
          },
          {
            description: 'Schema Customization Support',
            quantity: 5,
            rate: 150,
          },
        ],
      },
    });

    // Save the PDF locally
    await fs.writeFile('invoice.pdf', Buffer.from(pdfBuffer));

    console.log('PDF Invoice generated successfully!');
  } catch (error) {
    console.error('Failed to generate invoice:', error);
  }
}
generateSimpleInvoice();
```

### 2. VAT & Tax Invoice

Generate a VAT invoice using a template that includes the relevant tax fields. Check the resulting invoice against the requirements of your jurisdiction.

```js
import { InvoiceBuilder } from '@invoicing-builder/invoice-builder-sdk';
import * as fs from 'fs/promises';

const client = new InvoiceBuilder({
  apiKey: process.env.INVOICE_BUILDER_API_KEY,
});

async function generateVatInvoice() {
  try {
    const pdfBuffer = await client.generatePdf({
      templateId: 'template-id', // Replace with an ID from listTemplates()
      format: 'pdf',
      fields: {
        invoiceNumber: 'INV-2026-002',
        billTo: 'Nikolaus Ltd\nVAT ID: DE123456789\nBerlin, Germany',
        shipTo: 'Foster Moen\nVAT ID: FR987654321\nParis, France',
        date: '2026-07-09',
        dueDate: '2026-08-09',
        tax: 8,
        discount: 10,
        shipping: 15,
        amountPaid: 50,
        payment_terms: 'NET 30', // Use only if your template exposes this field
        terms: 'Payment is due within 30 days of invoice date.',
        notes: 'Thank you for doing business with us!',
        table: [
          {
            description: 'Software Engineering Services',
            quantity: 40,
            rate: 85,
          },
          {
            description: 'Cloud Deployment Infrastructure',
            quantity: 1,
            rate: 500,
          },
        ],
      },
    });

    await fs.writeFile('invoice.vat.pdf', Buffer.from(pdfBuffer));

    console.log('VAT invoice generated successfully!');
  } catch (error) {
    console.error('Failed to generate VAT invoice:', error);
  }
}
generateVatInvoice();
```

### 3. Complete Detailed Invoice

Generate a detailed PDF invoice using a comprehensive set of options including table items, custom fields like "PO Number", signature, logo, taxes, discounts, and shipping.

```js
import { InvoiceBuilder } from '@invoicing-builder/invoice-builder-sdk';
import * as fs from 'fs/promises';

const client = new InvoiceBuilder({
  apiKey: 'ib_your_api_key_here',
});
async function generateCompleteInvoice() {
  try {
    const pdfBuffer = await client.generatePdf({
      templateId: '567f5aa8-a0dc-4941-b782-bbcc536054f1',
      format: 'pdf',
      fields: {
        invoiceNumber: 'INV-2026-9021',
        date: '2026-07-11',
        dueDate: '2026-08-11',
        tax: 8,
        discount: 26,
        shipping: 25,
        amountPaid: 0,
        notes:
          'Thank you for choosing Antigravity Labs. Please transfer payment within 30 days.',
        terms: 'Net 30 days. Payments accepted via Bank Wire or Credit Card.',
        addLogo: 'https://example.com/logo.png',
        signature: 'https://example.com/signature.png',
        billTo:
          'Foster Moen\nNikolaus Group Inc\n456 Innovation Boulevard\nBerlin, 10117\nGermany\nPhone: +49 30 12345678\nEmail: billing@nikolaus-group.de',
        shipTo:
          'Antigravity Labs LLC\n100 Orbit Way, Suite 400\nSan Francisco, CA 94107\nUnited States\nPhone: +1 (415) 555-0190\nEmail: finance@antigravitylabs.io\nTax ID: US-99-8877665',
        table: [
          {
            description: 'Quantum Engineering Services (Hours)',
            quantity: 37.5,
            rate: 125,
          },
          {
            description: 'Cloud deployment & container orchestration (SaaS)',
            quantity: 1,
            rate: 850,
          },
          {
            description: 'Enterprise support retainer (Quarterly)',
            quantity: 1,
            rate: 120,
          },
        ],
        'PO Number': 'PO-99882',
      },
    });

    await fs.writeFile('complete-invoice.pdf', Buffer.from(pdfBuffer));

    console.log('Detailed PDF Invoice generated successfully!');
  } catch (error) {
    console.error('Failed to generate detailed invoice:', error);
  }
}
generateCompleteInvoice();
```

### 4. Custom Template Fields

Custom templates built with the visual template designer may have custom placeholders. You can match and target them directly using their custom labels or labels you define inside the builder.

```js
import { InvoiceBuilder } from '@invoicing-builder/invoice-builder-sdk';
import * as fs from 'fs/promises';

const client = new InvoiceBuilder({
  apiKey: 'ib_your_api_key_here',
});

async function checkAndFillTemplate() {
  // 1. Fetch editable fields metadata to see what custom placeholders exist
  const meta = await client.getTemplateFields({
    templateId: 'custom-billing-id',
  });
  console.log('Editable Fields:', meta.fields);
  // Example return: [{ id: "field_928", label: "PO Number", type: "text" }]
  // 2. Generate PDF using custom labels directly in fields payload
  const pdfBuffer = await client.generatePdf({
    templateId: 'custom-billing-id',
    format: 'pdf',
    fields: {
      invoiceNumber: 'INV-100',
      'PO Number': 'PO-99281A',
      'Account Number': 'ACT-77162',
      table: [{ description: 'Item A', quantity: 2, rate: 50.0 }],
    },
  });

  await fs.writeFile('custom-invoice.pdf', Buffer.from(pdfBuffer));
}
```

### 5. PNG Output

Use a template that supports PNG output. The returned bytes represent an image, so save them with a `.png` extension or respond with `image/png`.

```js
import { InvoiceBuilder } from '@invoicing-builder/invoice-builder-sdk';
import * as fs from 'fs/promises';

const client = new InvoiceBuilder({
  apiKey: process.env.INVOICE_BUILDER_API_KEY,
});

const pngBytes = await client.generatePdf({
  templateId: 'your-template-id',
  format: 'png',
  fields: { invoiceNumber: 'INV-PNG-001' },
});

await fs.writeFile('invoice.png', Buffer.from(pngBytes));
```

### 6. Multi-Template Batch Generation (ZIP)

Generate multiple invoices concurrently in a single API call. The SDK will return a ZIP archive containing all documents.

```js
import { InvoiceBuilder } from '@invoicing-builder/invoice-builder-sdk';
import * as fs from 'fs/promises';

const client = new InvoiceBuilder({
  apiKey: 'ib_your_api_key_here',
});

async function generateBatch() {
  try {
    const zipBuffer = await client.generatePdf([
      {
        templateId: 'template-a-id',
        format: 'pdf',
        fields: {
          invoiceNumber: 'INV-BATCH-01',
          billTo: 'Client One',
          table: [{ description: 'Consulting', quantity: 10, rate: 100 }],
        },
      },
      {
        templateId: 'template-b-id',
        format: 'pdf',
        fields: {
          invoiceNumber: 'INV-BATCH-02',
          billTo: 'Client Two',
          table: [{ description: 'Design work', quantity: 5, rate: 120 }],
        },
      },
    ]);

    await fs.writeFile('invoices.zip', Buffer.from(zipBuffer));

    console.log('ZIP archive saved successfully!');
  } catch (error) {
    console.error('Batch generation failed:', error);
  }
}
generateBatch();
```

---

## How to Find Your Template ID

To generate invoices, you need a `templateId`. Replace every sample ID in this README with an ID available to your account. You can obtain one in two ways:

### 1. Via the Web Dashboard

1. Log in to your **Invoicing Builder** account.

2. Go to the **Templates** section.

3. Click on the template you want to use.

4. Copy the unique ID from the template details panel or directly from the browser URL:

   `https://invoicingbuilder.com/templates/567f5aa8-a0dc-4941-b782-bbcc536054f1` (where `567f5aa8-a0dc-4941-b782-bbcc536054f1` is your `templateId`).

### 2. Programmatically Via the SDK

You can query all available templates on your account using the `listTemplates` API:

```js
import { InvoiceBuilder } from '@invoicing-builder/invoice-builder-sdk';

const client = new InvoiceBuilder({
  apiKey: 'ib_your_api_key_here',
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
    console.error('Failed to list templates:', error);
  }
}
findTemplates();
```

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

| Component Type                   | Payload / Value Rules                                                                                                                                   | Example Payload Value                           |
| :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------- |
| **Text / Textareas**             | Provide a direct string value. Use `\n` for line breaks.                                                                                                | `"billTo": "Client Corp\n123 Innovation Drive"` |
| **Dates**                        | Provide a string date value.                                                                                                                            | `"dueDate": "2026-06-30"`                       |
| **Logo & Signature**             | Use the field key exposed by your template; the examples use `addLogo`. Provide an image URL that the rendering service can access.                     | `"addLogo": "https://example.com/logo.png"`     |
| **Amount Paid**                  | Examples use a number; confirm that the selected template and API accept numeric values.                                                                | `"amountPaid": 150`                             |
| **Taxes / Discounts / Shipping** | Examples use numbers. Check the template's calculation settings to determine whether the field represents a percentage or a fixed amount.               | `"discount": 10`                                |
| **Table**                        | Pass an array of objects representing the rows. The table subtotal, taxes/discounts, and final balance will be automatically calculated on the backend. | See table structure in the examples above.      |

---

## Error Handling & Taxonomy

All SDK errors inherit from `InvoiceBuilderError`. API errors inherit from `ApiError` and expose `statusCode`, `requestId`, and `responseBody`.

```text
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

```js
import {
  InvoiceBuilder,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  ApiError,
} from '@invoicing-builder/invoice-builder-sdk';

const client = new InvoiceBuilder({
  apiKey: process.env.INVOICE_BUILDER_API_KEY,
});

try {
  await client.generatePdf({ templateId: 'invalid', format: 'pdf' });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key provided.');
  } else if (error instanceof RateLimitError) {
    console.error(
      error.retryAfter === undefined
        ? 'Rate limit reached. Try again later.'
        : `Rate limit reached. Try again after ${error.retryAfter}s.`,
    );
  } else if (error instanceof ValidationError) {
    console.error('Invalid payload:', error.validationDetails);
  } else if (error instanceof ApiError) {
    console.error(
      `API Error ${error.statusCode} [Request ID: ${error.requestId}]: ${error.message}`,
    );
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## Rate Limit Handling

When the API returns `HTTP 429 Too Many Requests`, the SDK throws a `RateLimitError`. Its optional `retryAfter` property is in seconds when the response provides a parseable `Retry-After` header or `retryAfter` value in the JSON body:

```js
import {
  InvoiceBuilder,
  RateLimitError,
} from '@invoicing-builder/invoice-builder-sdk';

const client = new InvoiceBuilder({
  apiKey: process.env.INVOICE_BUILDER_API_KEY,
});

try {
  await client.listTemplates();
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(
      error.retryAfter === undefined
        ? 'Rate limited. Try again later.'
        : `Rate limited. Retry after ${error.retryAfter} seconds.`,
    );
  }
}
```

---

## Getting Started & Examples

The examples in this README are intended for your own project. The npm package does not include an `examples/` directory. Install the SDK, set `INVOICE_BUILDER_API_KEY` in your server environment, replace the sample `templateId` with an ID returned by `listTemplates()`, and save a JavaScript example as `invoice.mjs` to run with `node invoice.mjs`. Do not place the secret key in a browser application.

## Advanced Usage

### Vercel Edge

The SDK uses native `fetch` and can run in edge compute runtimes. Set `INVOICE_BUILDER_API_KEY` as a server-side secret using the hosting platform’s configuration. This example uses a Vercel-style edge handler; other runtimes use different entry points and ways of reading secrets.

```js
import { InvoiceBuilder } from '@invoicing-builder/invoice-builder-sdk';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const client = new InvoiceBuilder({
    apiKey: process.env.INVOICE_BUILDER_API_KEY,
  });

  const pdfBytes = await client.generatePdf({
    templateId: 'your-template-id',
    format: 'pdf',
    fields: { invoiceNumber: 'INV-EDGE' },
  });

  return new Response(new Uint8Array(pdfBytes), {
    headers: { 'Content-Type': 'application/pdf' },
  });
}
```

### Express PDF Download

Deliver generated invoice binaries to authenticated, authorized users. Configure your application authentication middleware before this route so that it populates `req.user`. The access check below denies requests without an authorized user. Apply rate limits to generation routes as appropriate.

```js
const express = require('express');
const { InvoiceBuilder } = require('@invoicing-builder/invoice-builder-sdk');
const app = express();

// Set INVOICE_BUILDER_API_KEY in the server environment before starting Express.
const client = new InvoiceBuilder();

app.post('/download-invoice', async (req, res) => {
  if (!req.user?.canGenerateInvoices) {
    return res.sendStatus(403);
  }
  try {
    const pdfBuffer = await client.generatePdf({
      templateId: 'your-template-id',
      format: 'pdf',
      fields: { invoiceNumber: 'INV-123' },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('Invoice generation failed:', error);
    res.status(500).send({ error: 'Invoice generation failed' });
  }
});

app.listen(3000);
```

---

## Support & Feedback

If you encounter any bugs, have feature requests, or need help with integrations, please open an issue in the [GitHub issue tracker](https://github.com/InvoicingBuilder/invoice-builder-sdk/issues).
