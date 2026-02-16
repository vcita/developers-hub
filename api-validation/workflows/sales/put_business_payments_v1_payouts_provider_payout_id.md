---
endpoint: "PUT /business/payments/v1/payouts/{provider_payout_id}"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: pending
savedAt: 2026-02-06T19:49:28.285Z
verifiedAt: 2026-02-07T07:22:53.000Z
timesReused: 0
useFallbackApi: true
---
# Update Payouts

## Summary

PUT /business/payments/v1/payouts/{provider_payout_id} works when a real provider_payout_id is provided in the path. Retried with provider_payout_id='payout_test_1770399738' and body {payout:{total_amount:333.55}} → 200 OK.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Update payouts"
    method: PUT
    path: "/business/payments/v1/payouts/payout_test_1770399738"
    body:
      payout: {"total_amount":333.55}
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| required_field: provider_payout_id | Path parameter exists but error handling/validation not described; test sent no path value leading to 422 missing/Not Found | Controller requires provider_payout_id from route params and passes it to API component; missing param triggers 422 missing | - |
