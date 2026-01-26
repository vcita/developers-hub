---
endpoint: PUT /business/clients/v1/matters/{matter_uid}/nest
domain: clients
tags: []
status: success
savedAt: 2026-01-26T05:32:51.457Z
verifiedAt: 2026-01-26T05:32:51.457Z
timesReused: 0
---
# Update Nest

## Summary
Successfully nested matter under another contact person. The endpoint required a contact_uid in the request body, which was resolved by fetching existing clients from GET /platform/v1/clients.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| contact_uid | GET /platform/v1/clients | data.clients[0].id | - | No cleanup needed - used existing client |

### Resolution Steps

**contact_uid**:
1. Call `GET /platform/v1/clients`
2. Extract from response: `data.clients[0].id`

```json
{
  "contact_uid": {
    "source_endpoint": "GET /platform/v1/clients",
    "extract_from": "data.clients[0].id",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - used existing client"
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
  "path": "/business/clients/v1/matters/{{resolved.uid}}/nest",
  "body": {
    "contact_uid": "{{resolved.contact_uid}}"
  }
}
```