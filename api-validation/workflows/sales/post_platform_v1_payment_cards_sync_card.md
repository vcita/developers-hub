---
endpoint: POST /platform/v1/payment/cards/sync_card
domain: sales
tags: []
status: pass
savedAt: 2026-01-23T22:50:42.722Z
verifiedAt: 2026-01-23T22:50:42.722Z
timesReused: 0
---
# Create Sync card

## Summary
Successfully created sync card after fixing parameter typo and providing required card details. Original 500 error was caused by typo 'datails' instead of 'details' causing nil parameter. Endpoint works correctly with proper parameters.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/platform/v1/payment/cards/sync_card",
  "body": {
    "client_id": "2l2ut3opxv7heqcq",
    "customer_id": "cus_test_12345",
    "details": {
      "exp_month": "12",
      "exp_year": "2025",
      "last_4": "1234",
      "cardholder_name": "Test User",
      "card_brand": "Visa"
    },
    "default": false,
    "external_card_id": "card_test_sync_unique_999"
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| details | Documentation doesn't specify that 'details' parameter is required and cannot be empty/null. The API throws a 500 error (undefined method slice! for nil:NilClass) when details is null. | Update swagger documentation to mark 'details' as required and specify the required fields: exp_month, exp_year, last_4, cardholder_name, card_brand | critical |
| details | Documentation doesn't specify the required structure and fields within the 'details' object | Add details object schema to swagger with required fields: exp_month (string), exp_year (string), last_4 (string), cardholder_name (string), card_brand (string) | major |