---
endpoint: PUT /platform/v1/clients/merges/merge_clients
domain: clients
tags: []
status: success
savedAt: 2026-01-25T21:06:06.065Z
verifiedAt: 2026-01-25T21:06:06.065Z
timesReused: 0
---
# Update Merge clients

## Summary
Successfully merged clients. The endpoint requires to_client_uid and from_client_uids as query parameters, with an empty body. The clients must be from different contacts.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| to_client_uid | GET /platform/v1/clients | data.clients[1].id | - | - |
| from_client_uids | GET /platform/v1/clients | data.clients[2].id | - | - |

### Resolution Steps

**to_client_uid**:
1. Call `GET /platform/v1/clients`
2. Extract from response: `data.clients[1].id`
3. If empty, create via `POST /platform/v1/clients`

**from_client_uids**:
1. Call `GET /platform/v1/clients`
2. Extract from response: `data.clients[2].id`
3. If empty, create via `POST /platform/v1/clients`

```json
{
  "to_client_uid": {
    "source_endpoint": "GET /platform/v1/clients",
    "extract_from": "data.clients[1].id",
    "fallback_endpoint": "POST /platform/v1/clients",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": {
      "first_name": "Primary",
      "last_name": "Mergeable",
      "email": "primary{{timestamp}}@example.com"
    },
    "cleanup_endpoint": null,
    "cleanup_note": null
  },
  "from_client_uids": {
    "source_endpoint": "GET /platform/v1/clients",
    "extract_from": "data.clients[2].id",
    "fallback_endpoint": "POST /platform/v1/clients",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": {
      "first_name": "Secondary",
      "last_name": "Mergeable",
      "email": "secondary{{timestamp}}@example.com"
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
  "method": "PUT",
  "path": "/platform/v1/clients/merges/merge_clients?to_client_uid=b4b9ydxlm25bcckl&from_client_uids=8107yhbsp6jy7ozj",
  "body": {}
}
```