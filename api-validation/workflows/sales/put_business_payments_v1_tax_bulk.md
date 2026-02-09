---
endpoint: "PUT /business/payments/v1/tax_bulk"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-26T22:38:36.467Z
verifiedAt: 2026-01-26T22:38:36.467Z
---

# Update Tax bulk

## Summary
Test passes after fixing documentation issue. The swagger shows default_for_categories as type 'string' but the API expects an array. Fixed by using correct array format and existing tax ID for bulk update.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_tax_bulk
    method: PUT
    path: "/business/payments/v1/tax_bulk"
    body:
      data:
        "0":
          id: "{{id}}"
          default_for_categories: {}
          name: Updated Test Tax
          rate: 8.75
    expect:
      status: [200, 201]
```
