---
endpoint: "PUT /business/payments/v1/scheduled_payments_rules/{uid}/cancel"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-27T05:22:31.228Z"
verifiedAt: "2026-01-27T05:22:31.228Z"
timesReused: 0
---

# Update Cancel

## Summary
Test passes successfully. Scheduled payments rule was successfully canceled with status changing from 'active' to 'cancelled'.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_cancel
    method: PUT
    path: "/business/payments/v1/scheduled_payments_rules/{{uid}}/cancel"
    expect:
      status: [200, 201]
```
