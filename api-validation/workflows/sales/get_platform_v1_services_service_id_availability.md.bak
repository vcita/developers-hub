---
endpoint: GET /platform/v1/services/{service_id}/availability
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:07:07.177Z
verifiedAt: 2026-01-26T22:07:07.177Z
timesReused: 0
---
# Get Availability

## Summary
Test passes when required query parameters start_date and end_date are included. Original request was missing these mandatory parameters.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| service_id | Already resolved from config parameters | config.params.service_id | - | Using existing service - no cleanup needed |

### Resolution Steps

**service_id**:
1. Call `Already resolved from config parameters`
2. Extract from response: `config.params.service_id`

```json
{
  "service_id": {
    "source_endpoint": "Already resolved from config parameters",
    "extract_from": "config.params.service_id",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Using existing service - no cleanup needed"
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
  "method": "GET",
  "path": "/platform/v1/services/{{resolved.uid}}/availability?start_date=2024-01-01&end_date=2024-01-31"
}
```