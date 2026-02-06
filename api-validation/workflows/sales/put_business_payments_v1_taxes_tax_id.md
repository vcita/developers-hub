---
endpoint: "PUT /business/payments/v1/taxes/{tax_id}"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T22:39:39.810Z"
verifiedAt: "2026-01-26T22:39:39.810Z"
timesReused: 0
---

# Update Taxes

## Summary
Test passes after correcting default_for_categories from string to array format. The API expects an array of category strings, not a string value.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_taxes
    method: PUT
    path: "/business/payments/v1/taxes/{{tax_id}}"
    body:
      tax:
        default_for_categories: {}
        name: Updated Test Tax Name
        rate: 12.5
    expect:
      status: [200, 201]
```
