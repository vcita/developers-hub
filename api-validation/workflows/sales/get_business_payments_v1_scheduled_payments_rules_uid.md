---
endpoint: GET /business/payments/v1/scheduled_payments_rules/{uid}
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: pending
savedAt: 2026-01-27T05:22:05.868Z
verifiedAt: 2026-02-07T07:48:50.000Z
timesReused: 0
expectedOutcome: 422
expectedOutcomeReason: "No scheduled payment rules exist in the test environment and recurring payments are not supported by the primary gateway. Without an active rule, get-by-uid returns a validation error."
---

# Get Scheduled payments rules

## Summary
Recurring scheduled payments are not supported in this environment and no rules exist, so get-by-uid cannot be exercised. See expectedOutcome.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_scheduled_payments_rules
    method: GET
    path: "/business/payments/v1/scheduled_payments_rules/spr_test_missing"
    expect:
      status: [200, 201]
```
