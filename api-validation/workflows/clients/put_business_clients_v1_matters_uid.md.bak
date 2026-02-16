---
endpoint: PUT /business/clients/v1/matters/{uid}
domain: clients
tags: []
status: success
savedAt: 2026-01-26T05:33:48.499Z
verifiedAt: 2026-01-26T05:33:48.499Z
timesReused: 0
---
# Update Matters

## Summary
Successfully updated a Matter after resolving UID issues. Created a new matter and used an existing field UID for the update operation.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| matter_uid | GET /business/clients/v1/matters/{uid} | data.matter.uid | ✓ Yes | No DELETE endpoint available for matters |

### Resolution Steps

**matter_uid**:
1. **Create fresh test entity**: `undefined`
   - Body template: `{"matter":{"title":"Test Matter for Update Test {{timestamp}}","description":"Test matter created for testing PUT endpoint","fields":[{"uid":"wrytui9q48as6ovw","value":"Test Matter Name {{timestamp}}"}]}}`
2. Extract UID from creation response: `data.matter.uid`
3. Run the test with this fresh UID
4. **Cleanup note**: No DELETE endpoint available for matters

```json
{
  "matter_uid": {
    "source_endpoint": "GET /business/clients/v1/matters/{uid}",
    "extract_from": "data.matter.uid",
    "fallback_endpoint": "POST /business/clients/v1/contacts/{client_uid}/matters",
    "create_fresh": true,
    "create_endpoint": null,
    "create_body": {
      "matter": {
        "title": "Test Matter for Update Test {{timestamp}}",
        "description": "Test matter created for testing PUT endpoint",
        "fields": [
          {
            "uid": "wrytui9q48as6ovw",
            "value": "Test Matter Name {{timestamp}}"
          }
        ]
      }
    },
    "cleanup_endpoint": null,
    "cleanup_note": "No DELETE endpoint available for matters"
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
    "matter": {
      "fields": [
        {
          "uid": "{{resolved.uid}}",
          "value": "Updated Matter Name"
        }
      ]
    }
  }
}
```