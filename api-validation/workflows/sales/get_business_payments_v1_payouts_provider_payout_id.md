---
endpoint: "GET /business/payments/v1/payouts/{provider_payout_id}"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-26T22:03:21.950Z
verifiedAt: 2026-01-26T22:03:21.950Z
---

# Get Payouts

## Summary
Test passes after resolving provider_payout_id. Created a new payout and successfully retrieved it using GET /business/payments/v1/payouts/{provider_payout_id}.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_payouts
    method: GET
    path: "/business/payments/v1/payouts/{provider_payout_id}"
    expect:
      status: [200, 201]
```
