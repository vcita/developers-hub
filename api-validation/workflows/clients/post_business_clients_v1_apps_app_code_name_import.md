---
endpoint: POST /business/clients/v1/apps/{app_code_name}/import
domain: clients
tags: []
status: success
savedAt: 2026-01-25T20:40:28.293Z
verifiedAt: 2026-01-25T20:40:28.293Z
timesReused: 0
---
# Create Import

## Summary
Successfully tested POST /business/clients/v1/apps/{app_code_name}/import endpoint. Created and assigned an import_clients app, then successfully called the import endpoint with the required request body structure.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| app_code_name | - | data.app_code_name | ✓ POST /platform/v1/apps | App assignment can be cleaned up via DELETE /v3/apps/app_assignments/{uid} |
| app_assignment | - | data.uid | ✓ POST /v3/apps/app_assignments | DELETE /v3/apps/app_assignments/{uid} |

### Resolution Steps

**app_code_name**:
1. **Create fresh test entity**: `POST /platform/v1/apps`
   - Body template: `{"name":"Test Import Clients App","app_code_name":"testimportclients{{timestamp}}","app_type":"import_clients","redirect_uri":"https://example.com/callback"}`
2. Extract UID from creation response: `data.app_code_name`
3. Run the test with this fresh UID
4. **Cleanup note**: App assignment can be cleaned up via DELETE /v3/apps/app_assignments/{uid}

**app_assignment**:
1. **Create fresh test entity**: `POST /v3/apps/app_assignments`
   - Body template: `{"app_code_name":"testimportclients{{timestamp}}","assignee_uid":"{{business_uid}}","assignee_type":"business","settings":{"assignment_mode":"internal"}}`
2. Extract UID from creation response: `data.uid`
3. Run the test with this fresh UID
4. **Cleanup**: `DELETE /v3/apps/app_assignments/{uid}`

```json
{
  "app_code_name": {
    "source_endpoint": null,
    "extract_from": "data.app_code_name",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": "POST /platform/v1/apps",
    "create_body": {
      "name": "Test Import Clients App",
      "app_code_name": "testimportclients{{timestamp}}",
      "app_type": "import_clients",
      "redirect_uri": "https://example.com/callback"
    },
    "cleanup_endpoint": null,
    "cleanup_note": "App assignment can be cleaned up via DELETE /v3/apps/app_assignments/{uid}"
  },
  "app_assignment": {
    "source_endpoint": null,
    "extract_from": "data.uid",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": "POST /v3/apps/app_assignments",
    "create_body": {
      "app_code_name": "testimportclients{{timestamp}}",
      "assignee_uid": "{{business_uid}}",
      "assignee_type": "business",
      "settings": {
        "assignment_mode": "internal"
      }
    },
    "cleanup_endpoint": "DELETE /v3/apps/app_assignments/{uid}",
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
  "method": "POST",
  "path": "/business/clients/v1/apps/{{resolved.uid}}/import",
  "body": {
    "import_params": {
      "should_override": false,
      "upload_type": "single"
    },
    "fields_mapping": {
      "first_name": "John",
      "email": "john.doe@example.com",
      "phone": "555-123-4567"
    }
  }
}
```