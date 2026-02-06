---
endpoint: "POST /business/payments/v1/tax_bulk"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T14:18:35.613Z"
verifiedAt: "2026-01-26T14:18:35.613Z"
timesReused: 0
---

# Create Tax bulk

## Summary
Test passes after correcting default_for_categories format. The field should be an array of valid categories, not a string.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_tax_bulk
    method: POST
    path: "/business/payments/v1/tax_bulk"
    body:
      data:
        "0":
          default_for_categories:
            "0": services
            "1": products
          name: Test Tax
          rate: 10.5
    expect:
      status: [200, 201]
```
