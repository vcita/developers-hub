---
endpoint: "POST /business/payments/v1/taxes"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-26T21:35:28.064Z
verifiedAt: 2026-01-26T21:35:28.064Z
---

# Create Taxes

## Summary
Test passes after fixing the request format. The issue was that default_for_categories must be an array, not a string as documented in the swagger.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_taxes
    method: POST
    path: "/business/payments/v1/taxes"
    body:
      tax:
        default_for_categories: {}
        name: TestTax_1703788800
        rate: 8.75
    expect:
      status: [200, 201]
```
