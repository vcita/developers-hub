---
endpoint: PUT /business/payments/v1/scheduled_payments_rules/{uid}/cancel
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: pending
savedAt: 2026-01-27T05:22:31.228Z
verifiedAt: 2026-02-07T07:49:00.000Z
timesReused: 0
expectedOutcome: 422
expectedOutcomeReason: "No scheduled payment rules exist in the test environment and recurring payments are not supported by the primary gateway. Without an active rule, cancel returns a validation error."
---

# Update Cancel

## Summary
Recurring scheduled payments are not supported in this environment and no active rules exist, so cancel cannot be exercised. See expectedOutcome.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_cancel
    method: PUT
    path: "/business/payments/v1/scheduled_payments_rules/spr_test_missing/cancel"
    expect:
      status: [200, 201]
```
