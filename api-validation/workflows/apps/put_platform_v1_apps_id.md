---
endpoint: PUT /platform/v1/apps/{id}
domain: apps
tags: []
status: success
savedAt: 2026-01-25T05:53:29.337Z
verifiedAt: 2026-01-25T05:53:29.337Z
timesReused: 0
---
# Update Apps

## Summary
PUT /platform/v1/apps/{id} endpoint works correctly. Successfully updated app with empty body (HTTP 200) and with actual update data. The original "HTTP null" error appears to have been a transient network/infrastructure issue, not an API problem.

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
  "path": "/platform/v1/apps/testapp123",
  "body": {
    "name": "Updated Test App",
    "description": {
      "short_description": "This is a test description"
    }
  }
}
```