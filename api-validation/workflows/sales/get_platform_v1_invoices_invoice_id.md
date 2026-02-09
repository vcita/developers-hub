---
endpoint: "GET /platform/v1/invoices/{invoice_id}"
domain: sales
tags: [invoices]
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: "2026-01-26T22:04:57.737Z"
verifiedAt: "2026-02-08T00:00:00.000Z"
timesReused: 0
useFallbackApi: true
---

# Get Invoice By ID

## Summary
Retrieves a single invoice by its ID. The invoice_id is obtained from the invoices list endpoint.

**Token Type**: This endpoint requires a **Staff token** when using the fallback API.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway returns 422 Unauthorized for Staff tokens.

## Prerequisites

```yaml
steps:
  - id: list_invoices
    description: "Fetch an existing invoice ID from the invoices list"
    method: GET
    token: staff
    path: "/platform/v1/invoices?per_page=1"
    extract:
      invoice_id: "$.data.invoices[0].id"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_invoice_by_id
    description: "Get invoice details by ID"
    method: GET
    token: staff
    path: "/platform/v1/invoices/{{invoice_id}}"
    expect:
      status: [200, 201]
```
