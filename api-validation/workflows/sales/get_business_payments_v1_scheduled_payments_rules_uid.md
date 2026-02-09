---
endpoint: "GET /business/payments/v1/scheduled_payments_rules/{uid}"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-27T05:22:05.868Z
verifiedAt: 2026-01-27T05:22:05.868Z
---

# Get Scheduled payments rules

## Summary
Test passes. Resolved the missing uid parameter by fetching an existing scheduled payment rule from GET /business/payments/v1/scheduled_payments_rules and using its UID.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_scheduled_payments_rules
    method: GET
    path: "/business/payments/v1/scheduled_payments_rules/{uid}"
    expect:
      status: [200, 201]
```
