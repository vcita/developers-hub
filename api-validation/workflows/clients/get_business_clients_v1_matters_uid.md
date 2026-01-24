---
endpoint: GET /business/clients/v1/matters/{uid}
domain: clients
tags: []
status: verified
savedAt: 2026-01-23T08:44:35.846Z
verifiedAt: 2026-01-23T08:44:35.846Z
timesReused: 0
---
# Get Matters

## Summary
Successfully resolved matter UID by fetching from contacts/matters endpoint and retried original request

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| uid | /business/clients/v1/contacts/2l2ut3opxv7heqcq/matters | /business/clients/v1/contacts/{client_uid}/matters | No |

```json
{
  "uid": {
    "source_endpoint": "/business/clients/v1/contacts/2l2ut3opxv7heqcq/matters",
    "resolved_value": "7mxnm58ypxss5f4j",
    "used_fallback": false,
    "fallback_endpoint": "/business/clients/v1/contacts/{client_uid}/matters"
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
  "path": "/business/clients/v1/matters/7mxnm58ypxss5f4j"
}
```

## Documentation Fix Suggestions

No documentation issues found.