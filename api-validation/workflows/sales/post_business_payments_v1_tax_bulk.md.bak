---
endpoint: POST /business/payments/v1/tax_bulk
domain: sales
tags: []
status: success
savedAt: 2026-01-26T14:18:35.613Z
verifiedAt: 2026-01-26T14:18:35.613Z
timesReused: 0
---
# Create Tax bulk

## Summary
Test passes after correcting default_for_categories format. The field should be an array of valid categories, not a string.

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
  "path": "/business/payments/v1/tax_bulk",
  "body": {
    "data": [
      {
        "default_for_categories": [
          "services",
          "products"
        ],
        "name": "Test Tax",
        "rate": 10.5
      }
    ]
  }
}
```