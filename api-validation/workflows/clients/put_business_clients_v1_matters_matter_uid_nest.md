---
endpoint: PUT /business/clients/v1/matters/{matter_uid}/nest
domain: clients
tags: []
status: success
savedAt: 2026-01-25T21:03:51.422Z
verifiedAt: 2026-01-25T21:03:51.422Z
timesReused: 0
---
# Update Nest

## Summary
Successfully nested matter under another contact person. The endpoint requires a contact_uid in the request body to specify which contact person the matter should be nested under.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| contact_uid | GET /platform/v1/clients | data.clients[0].id | - | No cleanup needed - uses existing clients |

### Resolution Steps

**contact_uid**:
1. **Create fresh test entity**: `POST /platform/v1/clients`
2. Extract UID from creation response: `data.clients[0].id`
3. Run the test with this fresh UID
4. **Cleanup note**: No cleanup needed - uses existing clients

```json
{
  "contact_uid": {
    "source_endpoint": "GET /platform/v1/clients",
    "extract_from": "data.clients[0].id",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": "POST /platform/v1/clients",
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - uses existing clients"
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