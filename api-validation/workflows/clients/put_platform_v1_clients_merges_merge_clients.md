---
endpoint: PUT /platform/v1/clients/merges/merge_clients
domain: clients
tags: []
status: success
savedAt: 2026-02-02T20:43:58.732Z
verifiedAt: 2026-02-02T20:43:58.732Z
timesReused: 0
---
# Update Merge clients

## Summary
Endpoint works correctly with proper query parameters. Original failure due to missing to_client_uid and from_client_uids query parameters. Successfully merged clients when valid UIDs provided.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| client_uid | GET /platform/v1/clients | data.clients array - use different clients that represent different contact persons | - | Merge operation cannot be undone, but this is expected behavior for this endpoint |

### Resolution Steps

**client_uid**:
1. Call `GET /platform/v1/clients`
2. Extract from response: `data.clients array - use different clients that represent different contact persons`

```json
{
  "client_uid": {
    "source_endpoint": "GET /platform/v1/clients",
    "extract_from": "data.clients array - use different clients that represent different contact persons",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Merge operation cannot be undone, but this is expected behavior for this endpoint"
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
  "path": "/platform/v1/clients/merges/merge_clients?to_client_uid=238ns0xfsbz7xnvz&from_client_uids=3ucvl074fs4pjh6p",
  "body": {},
  "params": {
    "to_client_uid": "238ns0xfsbz7xnvz",
    "from_client_uids": "3ucvl074fs4pjh6p"
  }
}
```