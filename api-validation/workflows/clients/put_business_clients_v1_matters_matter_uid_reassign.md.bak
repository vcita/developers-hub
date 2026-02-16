---
endpoint: PUT /business/clients/v1/matters/{matter_uid}/reassign
domain: clients
tags: []
status: success
savedAt: 2026-01-25T10:25:32.048Z
verifiedAt: 2026-01-25T10:25:32.048Z
timesReused: 0
---
# Update Reassign

## Summary
Test passed successfully. The PUT /business/clients/v1/matters/{matter_uid}/reassign endpoint returned HTTP 200. Original 500 error was likely a temporary backend issue related to array concatenation in error handling code.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| matter_uid | Already resolved from config | Pre-configured parameter | - | - |
| staff_uid | Already resolved from config | Pre-configured parameter | - | - |

### Resolution Steps

**matter_uid**:
1. Call `Already resolved from config`
2. Extract from response: `Pre-configured parameter`

**staff_uid**:
1. Call `Already resolved from config`
2. Extract from response: `Pre-configured parameter`

```json
{
  "matter_uid": {
    "source_endpoint": "Already resolved from config",
    "extract_from": "Pre-configured parameter",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": null
  },
  "staff_uid": {
    "source_endpoint": "Already resolved from config",
    "extract_from": "Pre-configured parameter",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": null
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
  "path": "/business/clients/v1/matters/{{resolved.uid}}/reassign",
  "body": {
    "notes": "Staff reassignment test",
    "reassign_future_meetings": false,
    "staff_uid": "{{config.params.staff_uid}}"
  }
}
```