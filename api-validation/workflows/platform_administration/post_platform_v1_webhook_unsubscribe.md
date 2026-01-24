---
endpoint: POST /platform/v1/webhook/unsubscribe
domain: platform_administration
tags: []
status: verified
savedAt: 2026-01-23T09:59:56.619Z
verifiedAt: 2026-01-23T09:59:56.619Z
timesReused: 0
---
# Create Unsubscribe

## Summary
Test passes successfully. The POST /platform/v1/webhook/unsubscribe endpoint returned HTTP 200 with the expected response "Unsubscribed". No UID resolution was required as the endpoint only uses simple string parameters (event and target_url).

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
  "path": "/platform/v1/webhook/unsubscribe",
  "body": {
    "event": "invoice.created",
    "target_url": "https://example.com/webhook/endpoint"
  }
}
```

## Documentation Fix Suggestions

No documentation issues found.