---
endpoint: GET /business/clients/v1/matters/{uid}
domain: clients
tags: []
status: success
savedAt: 2026-01-26T05:28:51.365Z
verifiedAt: 2026-01-26T05:28:51.365Z
timesReused: 0
---
# Get Matters

## Summary
Successfully retrieved matter details using a valid matter UID. The original configured UID was invalid/non-existent, but using an existing matter UID (srwoxbmlnlrpadbj) from GET /business/clients/v1/contacts/{client_uid}/matters returned a complete matter object with all expected fields.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /business/clients/v1/contacts/{client_uid}/matters | data.matters[0].uid | - | - |

### Resolution Steps

**uid**:
1. Call `GET /business/clients/v1/contacts/{client_uid}/matters`
2. Extract from response: `data.matters[0].uid`
3. If empty, create via `POST /business/clients/v1/contacts/{client_uid}/matters`

```json
{
  "uid": {
    "source_endpoint": "GET /business/clients/v1/contacts/{client_uid}/matters",
    "extract_from": "data.matters[0].uid",
    "fallback_endpoint": "POST /business/clients/v1/contacts/{client_uid}/matters",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": {
      "display_name": "Test Matter {{timestamp}}",
      "fields": [
        {
          "value": "Test Matter {{timestamp}}"
        }
      ],
      "tags": [
        "test-tag"
      ]
    },
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
  "path": "/business/clients/v1/matters/{{resolved.uid}}"
}
```