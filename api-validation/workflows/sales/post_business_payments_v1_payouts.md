---
endpoint: "POST /business/payments/v1/payouts"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-27T05:11:07.714Z
verifiedAt: 2026-01-27T05:11:07.714Z
---

# Create Payouts

## Summary
Test passes after correcting datetime field formats. The API requires ISO8601 datetime format (e.g., '2024-01-01T08:00:00Z') for provider_created_time, provider_updated_time, and processed_time fields.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_payouts
    method: POST
    path: "/business/payments/v1/payouts"
    body:
      payout:
        provider_payout_id: test-payout-1735754449
        provider_created_time: 2024-01-01T08:00:00Z
        provider_updated_time: 2024-01-01T09:00:00Z
        status: pending
        total_amount: 100
        net: 95
        fee: 5
        other: 0
        processed_time: 2024-01-01T10:00:00Z
        currency: USD
        account_number: "1234567890"
    expect:
      status: [200, 201]
```
