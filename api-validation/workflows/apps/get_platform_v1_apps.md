---
endpoint: GET /platform/v1/apps
domain: apps
tags: []
status: verified
savedAt: 2026-01-23T08:39:42.875Z
verifiedAt: 2026-01-23T08:39:42.875Z
timesReused: 0
---
# Get Apps

## Summary
The GET /platform/v1/apps endpoint is working correctly. This is a list endpoint that doesn't require any specific UID fields and successfully returns a comprehensive list of all available apps with their details including app_id, app_name, app_code_name, descriptions, features, and status information.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "GET",
  "path": "/platform/v1/apps"
}
```

## Documentation Fix Suggestions

No documentation issues found.