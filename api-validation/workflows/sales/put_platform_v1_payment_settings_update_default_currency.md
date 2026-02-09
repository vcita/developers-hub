---
endpoint: PUT /platform/v1/payment/settings/update_default_currency
domain: sales
tags: [settings, payments]
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: verified
savedAt: 2026-02-06T20:49:00.000Z
verifiedAt: 2026-02-07T07:49:35.000Z
timesReused: 0
useFallbackApi: true
tokens: [staff]
---

# Update Default Currency

## Summary

Updates the default currency for payment settings. **Token Type**: Requires a **staff token**.

> ⚠️ **Fallback API Required** - This endpoint requires the fallback API due to gateway routing issues.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Update default currency to USD"
    method: PUT
    path: "/platform/v1/payment/settings/update_default_currency"
    body:
      currency: "USD"
    expect:
      status: [200, 201]
```