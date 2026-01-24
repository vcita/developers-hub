---
endpoint: GET /business/payments/v1/client_packages/{uid}
domain: sales
tags: []
status: verified
savedAt: 2026-01-23T08:46:34.577Z
verifiedAt: 2026-01-23T08:46:34.577Z
timesReused: 0
---
# Get Client packages

## Summary
Successfully resolved the missing UID parameter for the client packages endpoint. The original 401 Unauthorized error was due to missing the required {uid} path parameter. Fetched existing client packages and used the first available client package UID (6hc19iswntryf9rx) to retry the request successfully.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| uid | /platform/v1/clients/2l2ut3opxv7heqcq/payment/client_packages | - | No |

```json
{
  "uid": {
    "source_endpoint": "/platform/v1/clients/2l2ut3opxv7heqcq/payment/client_packages",
    "resolved_value": "6hc19iswntryf9rx",
    "used_fallback": false,
    "fallback_endpoint": null
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
  "path": "/business/payments/v1/client_packages/6hc19iswntryf9rx"
}
```

## Documentation Fix Suggestions

No documentation issues found.