---
endpoint: "PUT /business/payments/v1/payouts/{provider_payout_id}"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-26T22:29:09.915Z
verifiedAt: 2026-01-26T22:29:09.915Z
---

# Update Payouts

## Summary
Test passes after resolving provider_payout_id and correcting field types. Several fields documented as strings actually require numeric values.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_payouts
    method: PUT
    path: "/business/payments/v1/payouts/{provider_payout_id}"
    body:
      payout:
        account_number: test_string
        currency: USD
        fee: 5.99
        net: 94.01
        other: 0
        processed_time: 2024-01-01T00:00:00Z
        provider_created_time: 2024-01-01T00:00:00Z
        provider_updated_time: 2024-01-01T00:00:00Z
        status: completed
        total_amount: 100
    expect:
      status: [200, 201]
```
