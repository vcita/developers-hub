---
endpoint: "POST /business/payments/v1/scheduled_payments_rules"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-27T05:37:36.671Z
verifiedAt: 2026-01-27T05:37:36.671Z
---

# Create Scheduled payments rules

## Summary
Test passes after fixing currency (USD instead of test_string), frequency_type (one_time instead of OneTime), and using a valid payment method UID from the correct client.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_scheduled_payments_rules
    method: POST
    path: "/business/payments/v1/scheduled_payments_rules"
    body:
      scheduled_payments_rule:
        amount: 100
        currency: USD
        cycles: 1
        description: Test scheduled payment rule
        frequency_type: one_time
        matter_uid: "{{matter_uid}}"
        name: Test Scheduled Payment
        payment_method:
          type: card
          uid: "{{uid}}"
        send_receipt: true
        start_date: 2026-01-28T05:35:23.992Z
    expect:
      status: [200, 201]
```
