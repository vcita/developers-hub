---
endpoint: GET /platform/v1/scheduling/appointments/{appointment_id}
domain: scheduling
tags: []
status: success
savedAt: 2026-02-02T09:09:22.899Z
verifiedAt: 2026-02-02T09:09:22.899Z
timesReused: 0
---
# Get Appointments

## Summary
Endpoint works with app token but documentation incorrectly claims staff token support

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| appointment_id | GET /platform/v1/scheduling/appointments | first item id | - | - |

### Resolution Steps

**appointment_id**:
1. Call `GET /platform/v1/scheduling/appointments`
2. Extract from response: `first item id`

```json
{
  "appointment_id": {
    "source_endpoint": "GET /platform/v1/scheduling/appointments",
    "extract_from": "first item id",
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
  "method": "GET",
  "path": "/platform/v1/scheduling/appointments/{{resolved.uid}}"
}
```