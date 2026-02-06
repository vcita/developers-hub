---
endpoint: "PUT /business/payments/v1/cards/{uid}"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T22:17:47.209Z"
verifiedAt: "2026-01-26T22:17:47.209Z"
timesReused: 0
---

# Update Cards

## Summary
Test passes after using valid usage_permission value. The original request used 'test_string' which is invalid - only 'all' and 'client' are accepted.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_cards
    method: PUT
    path: "/business/payments/v1/cards/{{uid}}"
    body:
      card:
        default: true
        usage_permission: all
    expect:
      status: [200, 201]
```
