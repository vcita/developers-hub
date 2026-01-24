---
endpoint: POST /v3/payments/credit_notes
domain: payments
tags: []
status: skip
savedAt: 2026-01-23T22:35:20.080Z
verifiedAt: 2026-01-23T22:35:20.080Z
timesReused: 0
skipReason: Payment "pli5xylerql8pwv1" is not in the refundable payments list for invoice "4kjhnof5kds4tqy9" - this is a valid business constraint. The API correctly validates that only eligible payments can be refunded. Credit note creation succeeds when source_payment_uid is omitted (for general credit notes not tied to specific payment refunds).
---
# Create Credit notes

## Summary
Credit note creation works correctly, but specific payment is not refundable against this invoice

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Payment "pli5xylerql8pwv1" is not in the refundable payments list for invoice "4kjhnof5kds4tqy9" - this is a valid business constraint. The API correctly validates that only eligible payments can be refunded. Credit note creation succeeds when source_payment_uid is omitted (for general credit notes not tied to specific payment refunds).

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| source_payment_uid | GET /platform/v1/payments | Not needed | No |

```json
{
  "source_payment_uid": {
    "source_endpoint": "GET /platform/v1/payments",
    "resolved_value": "N/A - field is optional and was omitted for successful test",
    "used_fallback": false,
    "fallback_endpoint": "Not needed"
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/v3/payments/credit_notes",
  "body": {
    "invoice_uid": "4kjhnof5kds4tqy9",
    "notes": "Goodwill credit.",
    "line_items": [
      {
        "name": "Consulting Services Credit",
        "quantity": 1,
        "unit_amount": 50,
        "taxes": [
          {
            "name": "VAT",
            "rate": 20,
            "tax_total": 10
          }
        ]
      },
      {
        "name": "Custom Goodwill Credit",
        "quantity": 1,
        "unit_amount": 25,
        "taxes": []
      }
    ],
    "notify_recipient": true
  }
}
```

## Documentation Fix Suggestions

No documentation issues found.