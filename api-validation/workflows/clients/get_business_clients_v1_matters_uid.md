---
endpoint: GET /business/clients/v1/matters/{uid}
domain: clients
tags: []
status: success
savedAt: 2026-01-25T20:58:53.399Z
verifiedAt: 2026-01-25T20:58:53.399Z
timesReused: 0
---
# Get Matters

## Summary
Successfully retrieved matter details using valid matter UID. The original UID 'n0r6yxumbcp7bstu' was not a valid matter UID, but the test passes when using an actual matter UID like 'dqbqxo258gmaqctk'.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /business/clients/v1/contacts/{client_uid}/matters | data.matters[0].uid | - | Matters can be soft-deleted but cleanup endpoint not clearly documented |

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
      "tags": [
        "test"
      ]
    },
    "cleanup_endpoint": null,
    "cleanup_note": "Matters can be soft-deleted but cleanup endpoint not clearly documented"
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