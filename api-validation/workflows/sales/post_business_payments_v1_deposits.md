---
endpoint: POST /business/payments/v1/deposits
domain: sales
tags: []
status: pass
savedAt: 2026-01-23T22:06:28.986Z
verifiedAt: 2026-01-23T22:06:28.986Z
timesReused: 0
---
# Create Deposits

## Summary
Successfully created deposit after discovering the correct request format through source code exploration

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
  "path": "/business/payments/v1/deposits",
  "body": {
    "deposit": {
      "currency": "USD",
      "matter_uid": "cgt7b6dcesjntvic",
      "amount": {
        "type": "fixed",
        "value": 25,
        "total": 25
      },
      "entity_uid": "27nwmt53igf7a9nv",
      "entity_type": "Invoice",
      "can_client_pay": true
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| amount | Documentation shows amount as a simple object with cents/currency, but actually requires type, value, total fields | Update swagger to show amount as object with required fields: type (string, must be 'fixed' or 'precentage'), value (number), total (number), and optional is_rounded (boolean) | critical |
| entity_type | Documentation doesn't specify valid entity_type values. Shows example as 'client' but only 'Invoice' and 'Estimate' are accepted | Update swagger to specify entity_type must be one of: 'Invoice', 'Estimate' | critical |
| amount.type | API code contains typo 'precentage' instead of 'percentage' but validation accepts this misspelled value | Either fix the typo in the code or document that 'precentage' is the correct spelling to use | minor |
| payment_uid | When payment_uid is provided, the payment amount must exactly match deposit amount, but this constraint is not documented | Add documentation that if payment_uid is provided, the payment's amount must match the deposit amount exactly | major |
| entity_uid | Entity must belong to the same matter as the deposit and cannot already have an existing deposit, but these constraints are not documented | Document that: 1) entity_uid must belong to same matter as matter_uid, 2) entity cannot already have a deposit | major |