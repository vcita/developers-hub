---
endpoint: "GET /platform/v1/invoices"
domain: sales
tags: [invoices]
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: "2026-02-05T00:00:00.000Z"
verifiedAt: "2026-02-05T00:00:00.000Z"
timesReused: 0
---

# Get Invoices List (Staff-compatible)

## Summary

Retrieves a list of invoices for the business. This endpoint is staff-oriented, but for deterministic validation in this runner we use a **Directory token** (acting on behalf of the business) and filter by `client_id` as a query parameter.

## Prerequisites

```yaml
steps:
  - id: get_client
    description: "Fetch a client from the business"
    method: GET
    token: directory
    path: "/platform/v1/clients"
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
  - id: get_invoices_list_for_client
    description: "Get invoices list filtered by client_id (query param)"
    method: GET
    token: directory
    path: "/platform/v1/invoices"
    params:
      client_id: "{{client_id}}"
    expect:
      status: [200, 201]
```

## Notes

- `client_id` here is treated as a client UID in Core (`params[:client_id]`), even though it is not documented as a query parameter in Swagger for this endpoint.
- This endpoint still requires staff permissions to view payments (e.g., `can_view_payments?`).

