---
endpoint: GET /v3/license/subscriptions/{uid}
domain: platform_administration
tags: []
status: verified
savedAt: 2026-01-23T08:48:53.179Z
verifiedAt: 2026-01-23T08:48:53.179Z
timesReused: 0
---
# Get Subscriptions

## Summary
Successfully resolved subscription UID and retrieved subscription details. The endpoint was failing because no valid subscription UID was provided in the path parameter.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| uid | GET /v3/license/subscriptions | POST /v3/license/subscriptions | No |

```json
{
  "uid": {
    "source_endpoint": "GET /v3/license/subscriptions",
    "resolved_value": "14475afb-83e6-4eed-ba61-de38dc736959",
    "used_fallback": false,
    "fallback_endpoint": "POST /v3/license/subscriptions"
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "GET",
  "path": "/v3/license/subscriptions/14475afb-83e6-4eed-ba61-de38dc736959"
}
```

## Documentation Fix Suggestions

No documentation issues found.