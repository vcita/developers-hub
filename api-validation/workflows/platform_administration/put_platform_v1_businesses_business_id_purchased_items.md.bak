---
endpoint: PUT /platform/v1/businesses/{business_id}/purchased_items
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-29T08:10:25.490Z
verifiedAt: 2026-01-29T08:10:25.490Z
timesReused: 0
---
# Update Purchased items

## Summary
Endpoint works with directory token and valid types ('staffs', 'sms'). Found several documentation issues including incorrect schema structure, missing auth requirements, and invalid type examples.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| business_id | Available in config parameters | business_id parameter | - | No cleanup needed - using existing business |

### Resolution Steps

**business_id**:
1. Call `Available in config parameters`
2. Extract from response: `business_id parameter`

```json
{
  "business_id": {
    "source_endpoint": "Available in config parameters",
    "extract_from": "business_id parameter",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - using existing business"
  }
}
```

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
        "type": "staffs",
        "data": {
          "bundled": 5,
          "purchased": 12
        }
      },
      {
        "type": "sms",
        "data": {
          "bundled": 3,
          "purchased": 8
        }
      }
    ]
  }
}
```