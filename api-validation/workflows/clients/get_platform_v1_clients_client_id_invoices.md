---
endpoint: "GET /platform/v1/clients/{client_id}/invoices"
domain: clients
tags: [invoices, client]
swagger: "swagger/clients/legacy/legacy_v1_clients.json"
status: verified
savedAt: "2026-02-04T12:00:00.000Z"
verifiedAt: "2026-02-04T12:00:00.000Z"
timesReused: 0
---

# Get Client Invoices

## Summary

Retrieves invoices for a specific client. The endpoint requires a valid `client_id` in the path.

**Token Type**: For deterministic validation in this runner, use a **Directory token** (the runner will send `X-On-Behalf-Of` automatically).

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Invoices retrieved |
| 201 | Success - Invoices retrieved (alternate) |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - No access to client |
| 404 | Not Found - Client doesn't exist |

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

  - id: create_invoice
    description: "Create an invoice for the client to ensure test data exists"
    method: POST
    token: directory
    path: "/platform/v1/invoices"
    body:
      client_id: "{{client_id}}"
      title: "Test Invoice"
      currency: "USD"
      items:
        - title: "Test Item"
          amount: 1000
          quantity: 1
    extract:
      invoice_uid: "$.data.invoice.uid"
    expect:
      status: [200, 201]
    onFail: skip
    skipReason: "Invoice creation may fail if invoicing module is not enabled, but we can still test the GET endpoint"
```

## Test Request

```yaml
steps:
  - id: get_client_invoices
    description: "Get invoices for the client"
    method: GET
    token: directory
    path: "/platform/v1/clients/{{client_id}}/invoices"
    expect:
      status: [200, 201]
```

## Critical Learnings

1. **Client ID from path**: The endpoint uses `client_id` from the URL path, not from token
2. **Staff token access**: Staff must have access to the client's business
3. **Empty list is valid**: Endpoint returns 200/201 even if client has no invoices

## Notes

- The `client_id` parameter must be a valid client that the token has access to
- For Staff tokens, the client must belong to the same business
- For Directory tokens, `X-On-Behalf-Of` header with business UID is required (the workflow runner adds it automatically for `token: directory`)
