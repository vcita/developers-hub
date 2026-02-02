---
endpoint: "POST /v3/payment_processing/payment_gateway_assignments"
domain: sales
tags: []
swagger: swagger/sales/payment_gateway.json
status: success
savedAt: 2026-01-27T04:20:22.927Z
verifiedAt: 2026-01-27T04:20:22.927Z
---

# Create Payment gateway assignments

## Summary
Test passes after resolving gateway_uid with a valid payment gateway UID from GET /v3/payment_processing/payment_gateways endpoint. Used PayPal wallet gateway which wasn't already assigned to the directory.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_payment_gateway_assignments
    method: POST
    path: "/v3/payment_processing/payment_gateway_assignments"
    body:
      gateway_uid: "{{gateway_uid}}"
      directory_uid: "{{directory_uid}}"
    expect:
      status: [200, 201]
```
