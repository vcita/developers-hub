---
endpoint: POST /v3/scheduling/resource_types
domain: scheduling
tags: []
status: success
savedAt: 2026-02-02T08:04:11.875Z
verifiedAt: 2026-02-02T08:04:11.875Z
timesReused: 0
---
# Create Resource types

## Summary
Endpoint works successfully with app token. Created and deleted resource type "Conference Room". Authentication documentation issue discovered.

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
  "path": "/v3/scheduling/resource_types",
  "body": {
    "name": "Conference Room"
  }
}
```