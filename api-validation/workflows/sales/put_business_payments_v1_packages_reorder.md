---
endpoint: "PUT /business/payments/v1/packages/reorder"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-26T22:28:03.824Z
verifiedAt: 2026-01-26T22:28:03.824Z
---

# Update Reorder

## Summary
Test passes after resolving valid package IDs. The original request used a placeholder package ID that doesn't exist, but when using real package IDs from GET /platform/v1/payment/packages, the endpoint works correctly and returns HTTP 200.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_reorder
    method: PUT
    path: "/business/payments/v1/packages/reorder"
    body:
      packages:
        "0":
          id: "{{id}}"
          order: 1
        "1":
          id: "{{id}}"
          order: 2
    expect:
      status: [200, 201]
```
