---
endpoint: "PUT /business/payments/v1/scheduled_payments_rules/{uid}"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-27T05:47:09.538Z
verifiedAt: 2026-01-27T05:47:09.538Z
---

# Update Scheduled payments rules

## Summary
Test passes after using an active scheduled payment rule. The original UID referred to a cancelled rule, but UPDATE operations require the rule to have status='active'.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_scheduled_payments_rules
    method: PUT
    path: "/business/payments/v1/scheduled_payments_rules/{uid}"
    body:
      scheduled_payments_rule:
        payment_method:
          type: card
          uid: "{{uid}}"
    expect:
      status: [200, 201]
```
