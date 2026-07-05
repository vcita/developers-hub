---
endpoint: GET /platform/v1/payments
domain: sales
tags: [payments]
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: verified
savedAt: 2026-02-08T16:43:00.000Z
verifiedAt: 2026-02-08T16:43:00.000Z
timesReused: 0
tokens: [staff]
---

# List Payments

## Summary

Lists all payments for a business. This endpoint requires a **staff token** and must use the fallback API. The main API gateway returns 422 Unauthorized for staff tokens, but the fallback API works correctly.

**Token Type**: This endpoint requires a **Staff token**.

## Authentication

| Token Type | Works | Notes |
|------------|-------|-------|
| Staff | ✅ | Works with fallback API |
| Directory | ❌ | Returns 422 Unauthorized |

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "List all payments for the business"
    method: GET
    path: "/platform/v1/payments"
    token: staff
    params:
      business_id: "{{business_id}}"
    expect:
      status: [200, 201]
```

## Response Notes

- Returns HTTP 201 (not 200) for successful GET requests, which is non-standard but expected
- Response contains a list of payments with full payment details including state, amount, client info, and payment methods
- Each payment includes associated payable entities and payment requests