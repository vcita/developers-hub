---
endpoint: "GET /platform/v1/clients/payment/client_packages/validate"
domain: clients
tags: []
swagger: swagger/clients/legacy/legacy_v1_clients.json
status: pending
savedAt: 2026-01-25T09:10:11.000Z
verifiedAt: 2026-01-25T09:10:11.000Z
---

# Get Client packages

## Summary
Validates client package redemption. Requires payment_status_id query parameter.

## Prerequisites

```yaml
steps:
  - id: get_payment_requests
    description: "Get a payment request to use as payment_status_id"
    method: GET
    path: "/business/payments/v1/payment_requests"
    extract:
      payment_status_id: "$.data.payment_requests[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_validate
    method: GET
    path: "/platform/v1/clients/payment/client_packages/validate?payment_status_id={{payment_status_id}}"
    expect:
      status: [200, 201, 422]
```
