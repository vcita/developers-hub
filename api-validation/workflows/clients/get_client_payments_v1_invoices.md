---
endpoint: "GET /client/payments/v1/invoices"
domain: clients
tags: []
swagger: "swagger/clients/legacy/clients_payments.json"
status: verified
savedAt: "2026-01-26T05:22:48.274Z"
verifiedAt: "2026-01-26T05:22:48.274Z"
timesReused: 0
---

# Get Invoices

## Summary
Test passes successfully. The endpoint requires client token authentication as documented. Using token_type='client' returns HTTP 200 with a valid list of invoices.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_invoices
    method: GET
    path: "/client/payments/v1/invoices"
    expect:
      status: [200, 201]
```
