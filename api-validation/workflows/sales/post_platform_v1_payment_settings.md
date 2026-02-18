---
endpoint: POST /platform/v1/payment/settings
domain: sales
tags: [settings, payments]
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: verified
savedAt: 2026-01-26T20:05:40.839Z
verifiedAt: 2026-02-07T08:02:35.000Z
timesReused: 0
tokens: [staff]
---

# Create Payment Settings

## Summary
Updates payment settings using a staff token. **Token Type**: Requires a **staff token**.

> ⚠️ **Fallback API Required** - This endpoint requires the fallback API due to gateway routing issues.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_settings
    method: POST
    path: "/platform/v1/payment/settings"
    body:
      payment_settings:
        allow_view_payments: true
        currency: USD
    expect:
      status: [200, 201]
```