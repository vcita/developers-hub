---
endpoint: POST /business/search/v1/views/bulk
domain: clients
tags: []
status: success
savedAt: 2026-01-25T19:28:04.334Z
verifiedAt: 2026-01-25T19:28:04.334Z
timesReused: 0
---
# Create Bulk

## Summary
Bulk update views endpoint works, but has documentation/implementation mismatch. The swagger documentation expects format with 'updates' wrapper, but implementation expects direct parameters.

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
  "path": "/business/search/v1/views/bulk",
  "body": {
    "views": [
      {
        "uid": "{{resolved.uid}}",
        "pinned": true,
        "order": 1,
        "name": "Updated Name"
      }
    ]
  }
}
```