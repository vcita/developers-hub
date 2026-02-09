---
endpoint: "GET /v3/payment_processing/payment_gateways"
domain: sales
tags: [payment_processing, payment_gateways]
swagger: "swagger/sales/sales.json"
status: verified
savedAt: 2026-01-27T18:20:00.000Z
verifiedAt: 2026-01-27T18:20:00.000Z
timesReused: 0
tokens: [directory]
---

# List Payment Gateways

## Summary
Retrieves a list of available payment gateways for payment processing. **Token Type**: Requires a **directory token** with X-On-Behalf-Of header.

## Test Request
```yaml
steps:
  - id: list_payment_gateways
    method: GET
    path: "/v3/payment_processing/payment_gateways"
    token: directory
    expect:
      status: 200
```