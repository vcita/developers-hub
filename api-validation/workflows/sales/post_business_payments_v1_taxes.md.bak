---
endpoint: POST /business/payments/v1/taxes
domain: sales
tags: []
status: success
savedAt: 2026-01-26T21:35:28.064Z
verifiedAt: 2026-01-26T21:35:28.064Z
timesReused: 0
---
# Create Taxes

## Summary
Test passes after fixing the request format. The issue was that default_for_categories must be an array, not a string as documented in the swagger.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "POST",
  "path": "/business/payments/v1/taxes",
  "body": {
    "tax": {
      "default_for_categories": [],
      "name": "TestTax_1703788800",
      "rate": 8.75
    }
  }
}
```