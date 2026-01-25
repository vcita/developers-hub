---
endpoint: PUT /business/clients/v1/matters/{uid}
domain: clients
tags: []
status: success
savedAt: 2026-01-25T21:05:14.256Z
verifiedAt: 2026-01-25T21:05:14.256Z
timesReused: 0
---
# Update Matters

## Summary
Successfully updated matter after resolving invalid UIDs. Test passed with HTTP 200 using valid matter_uid and field_uid from existing entities.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| matter_uid | GET /business/clients/v1/contacts/{client_uid}/matters | data.matters[0].uid | - | No DELETE endpoint available for matters cleanup |
| field_uid_in_request | GET /business/clients/v1/contacts/{client_uid}/matters | data.matters[0].fields[0].uid (from existing matter's fields) | - | Field UIDs are matter-specific and not independently deletable |

### Resolution Steps

**matter_uid**:
1. **Create fresh test entity**: `POST /business/clients/v1/contacts/{client_uid}/matters`
   - Body template: `{"matter":{"fields":[{"uid":"{{field_uid}}","value":"Test Matter {{timestamp}}"}],"tags":["test"]}}`
2. Extract UID from creation response: `data.matters[0].uid`
3. Run the test with this fresh UID
4. **Cleanup note**: No DELETE endpoint available for matters cleanup

**field_uid_in_request**:
1. Call `GET /business/clients/v1/contacts/{client_uid}/matters`
2. Extract from response: `data.matters[0].fields[0].uid (from existing matter's fields)`
3. If empty, create via `Create matter with fields to get valid field UIDs`

```json
{
  "matter_uid": {
    "source_endpoint": "GET /business/clients/v1/contacts/{client_uid}/matters",
    "extract_from": "data.matters[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": "POST /business/clients/v1/contacts/{client_uid}/matters",
    "create_body": {
      "matter": {
        "fields": [
          {
            "uid": "{{field_uid}}",
            "value": "Test Matter {{timestamp}}"
          }
        ],
        "tags": [
          "test"
        ]
      }
    },
    "cleanup_endpoint": null,
    "cleanup_note": "No DELETE endpoint available for matters cleanup"
  },
  "field_uid_in_request": {
    "source_endpoint": "GET /business/clients/v1/contacts/{client_uid}/matters",
    "extract_from": "data.matters[0].fields[0].uid (from existing matter's fields)",
    "fallback_endpoint": "Create matter with fields to get valid field UIDs",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Field UIDs are matter-specific and not independently deletable"
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
          "value": "Updated test value"
        }
      ]
    }
  }
}
```