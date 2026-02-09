# Workflow Repository

A searchable, LLM-friendly repository of verified API workflows for the validation framework.

## Quick Links

- **[TEMPLATE.md](./TEMPLATE.md)** - Canonical format for all workflow files
- **[CONSISTENCY_AUDIT.md](./CONSISTENCY_AUDIT.md)** - Audit of existing inconsistencies

## Purpose

This repository stores successful API test workflows that can be:
- **Reused** by the AI healer to quickly fix similar failures
- **Referenced** by developers to understand API requirements
- **Searched** by future agentic frameworks

## Structure

```
workflows/
├── index.json              # Quick lookup index (auto-generated)
├── README.md               # This file
├── TEMPLATE.md             # Canonical workflow format (NEW)
├── CONSISTENCY_AUDIT.md    # Audit report (NEW)
├── sales/                  # Domain-specific folders
│   ├── post_platform_v1_payments.md
│   └── get_business_payments_v1_invoices.md
├── clients/
│   └── get_platform_v1_clients.md
├── scheduling/
│   └── post_platform_v1_scheduling_bookings.md
├── communication/
│   └── post_platform_v1_messages.md
├── platform_administration/
│   └── post_platform_v1_businesses.md
├── apps/
│   └── post_platform_v1_apps.md
└── reviews/
    └── post_v3_reviews_business_reviews_settings.md
```

## Workflow File Format

> **Important**: See [TEMPLATE.md](./TEMPLATE.md) for the complete canonical format.

Each workflow is stored as a Markdown file with YAML frontmatter:

```markdown
---
endpoint: "POST /platform/v1/payments"
domain: sales
tags: [payments, cash, manual]
swagger: swagger/sales/legacy/payments.json
status: verified
savedAt: 2026-01-26T21:58:21.948Z
verifiedAt: 2026-01-26T21:58:21.948Z
timesReused: 0
---

# Create Payment

## Summary
Brief description of what this endpoint does.
**Token Type**: This endpoint requires a **Staff token**.

## Response Codes
Table of possible HTTP status codes.

## Prerequisites
YAML steps to fetch required data, or "None required."

## Test Request
YAML steps defining the actual test.

## Parameters Reference
Table of path, query, and body parameters.

## Expected Response
JSON example of successful response.

## Error Responses
Common error scenarios with examples.

## Critical Learnings
Important gotchas discovered during testing.
```

### Status Values

| Status | Meaning |
|--------|---------|
| `verified` | Test passed, workflow is reliable |
| `pending` | Not yet verified |
| `failed` | Consistently fails |
| `skipped` | Environment limitations |

### Domain Values

| Domain | Description |
|--------|-------------|
| `sales` | Payments, invoices, products |
| `clients` | Client management, CRM |
| `scheduling` | Bookings, availability |
| `communication` | Messages, notifications |
| `platform_administration` | Businesses, staffs |
| `apps` | OAuth, widgets |
| `reviews` | Business reviews |

## Searching Workflows

### By Endpoint (exact)
```javascript
const workflow = repository.get('POST /platform/v1/payment/packages');
```

### By Domain
```javascript
const salesWorkflows = repository.list('sales');
```

### By Tag
```javascript
const results = repository.search({ tags: ['payments'] });
```

### Full-text Search
```bash
grep -r "products must be" workflows/
```

## How Workflows Are Created

1. A test fails during validation
2. The AI healer analyzes and fixes the issue
3. **Verification**: The fix must return a 2xx response
4. Only after verification, the workflow is saved
5. The index.json is automatically updated

## Using in Other Agents

```javascript
const repository = require('./src/core/workflows/repository');

// Search for relevant workflows
const workflow = repository.get('POST /platform/v1/payment/packages');

// Get all workflows for a domain
const salesWorkflows = repository.list('sales');

// Search by tags
const results = repository.search({ tags: ['payments'] });
```

## Index Structure

The `index.json` provides fast lookups:

```json
{
  "version": "1.0",
  "workflows": {
    "POST /platform/v1/payment/packages": {
      "file": "sales/payment_packages.md",
      "domain": "sales",
      "tags": ["packages", "payments"],
      "status": "verified"
    }
  },
  "byDomain": { "sales": [...] },
  "byTag": { "payments": [...] }
}
```

## Best Practices

1. **Always verify before saving** - Workflows must have a successful API call
2. **Document learnings** - Include gotchas and non-obvious requirements
3. **Use meaningful tags** - Help future searches find relevant workflows
4. **Keep prerequisites clear** - Explain what's needed before the call
