---
endpoint: "GET /platform/v1/invoices"
domain: sales
tags: [invoices]
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: "2026-02-08T16:45:00.000Z"
verifiedAt: "2026-02-08T16:45:00.000Z"
timesReused: 0
useFallbackApi: true
---

# Get Invoices List

## Summary
Retrieves a list of invoices for the business. **Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required
> This endpoint must use the fallback API URL. The main API gateway may return errors for Staff tokens.

## Prerequisites

```yaml
steps:
  - id: get_client_id
    description: "Fetch a client ID for the business"
    method: GET
    path: "/platform/v1/clients"
    token: staff
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_id: "$.data.clients[0].id"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_invoices_list
    description: "Get invoices list for the business"
    method: GET
    path: "/platform/v1/invoices"
    token: staff
    params:
      business_id: "{{business_id}}"
      per_page: "5"
    expect:
      status: [200, 201]
```