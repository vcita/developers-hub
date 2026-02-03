---
endpoint: PUT /platform/v1/businesses/{business_uid}/purchased_items
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-28T12:03:46.165Z
verifiedAt: 2026-01-28T12:03:46.165Z
timesReused: 0
---
# Update Purchased items

## Summary
Endpoint works correctly with directory/app tokens and valid type values ('staffs' or 'sms'). Staff tokens are not authorized. The original test data used invalid type values.

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
  "method": "PUT",
  "path": "/platform/v1/businesses/{{resolved.uid}}/purchased_items",
  "body": {
    "data": [
      {
        "type": "sms",
        "data": {
          "bundled": 2,
          "purchased": 7
        }
      }
    ]
  }
}
```