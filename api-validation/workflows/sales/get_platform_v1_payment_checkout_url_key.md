---
endpoint: "GET /platform/v1/payment/checkout/{url_key}"
domain: sales
tags: []
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: success
savedAt: 2026-01-26T22:06:09.436Z
verifiedAt: 2026-01-26T22:06:09.436Z
---

# Get Checkout

## Summary
Test passes. The checkout endpoint successfully retrieves checkout information when provided with a valid payment request UID as the url_key parameter. Used existing payment request UID '86fgkwzpk85tw434' from GET /business/payments/v1/payment_requests.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_checkout
    method: GET
    path: "/platform/v1/payment/checkout/{url_key}"
    expect:
      status: [200, 201]
```
