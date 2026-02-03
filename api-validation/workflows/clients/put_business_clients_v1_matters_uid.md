---
endpoint: PUT /business/clients/v1/matters/{uid}
domain: clients
tags: []
status: success
savedAt: 2026-02-02T20:43:03.321Z
verifiedAt: 2026-02-02T20:43:03.321Z
timesReused: 0
---
# Update Matters

## Summary
Endpoint works correctly with valid matter UID. The original error was caused by using an invalid/non-existent matter UID in the path parameter.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /business/clients/v1/contacts/{client_uid}/matters | data.matters[0].uid | - | No cleanup needed - updating existing matters doesn't require deletion |
| matter.fields[].uid | GET /business/clients/v1/matters/{uid} | data.matter.fields[0].uid | - | Field UIDs are retrieved from the matter being updated - no separate creation needed |

### Resolution Steps

**uid**:
1. Call `GET /business/clients/v1/contacts/{client_uid}/matters`
2. Extract from response: `data.matters[0].uid`
3. If empty, create via `POST /business/clients/v1/contacts/{client_uid}/matters`

**matter.fields[].uid**:
1. Call `GET /business/clients/v1/matters/{uid}`
2. Extract from response: `data.matter.fields[0].uid`

```json
{
  "uid": {
    "source_endpoint": "GET /business/clients/v1/contacts/{client_uid}/matters",
    "extract_from": "data.matters[0].uid",
    "fallback_endpoint": "POST /business/clients/v1/contacts/{client_uid}/matters",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - updating existing matters doesn't require deletion"
  },
  "matter.fields[].uid": {
    "source_endpoint": "GET /business/clients/v1/matters/{uid}",
    "extract_from": "data.matter.fields[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Field UIDs are retrieved from the matter being updated - no separate creation needed"
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
  "path": "/business/clients/v1/matters/{{resolved.uid}}",
  "body": {
    "matter": {}
  }
}
```