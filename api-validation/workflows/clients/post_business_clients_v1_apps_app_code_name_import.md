---
endpoint: "POST /business/clients/v1/apps/{app_code_name}/import"
domain: clients
tags: [clients, import, apps]
swagger: "mcp_swagger/clients.json"
status: verified
savedAt: 2026-02-06T10:51:31.309Z
verifiedAt: 2026-02-06T11:22:04.000Z
timesReused: 0
requiresTestData: true
testDataDescription: "Business must have an import_clients app installed (e.g. testimportapp123456)"
tokens: [staff]
---

# Import Clients via App

## Summary

Triggers a client import via an installed import_clients app. The `app_code_name` path parameter must reference an app that is both of type `import_clients` AND installed for the business. Using an app that is assigned but not of the correct type returns 422 'not installed for the business'.

**Token Type**: This endpoint requires a **Staff token**.

## Response Codes

| Status | Meaning |
|--------|---------|
| 201 | Success - Import job queued |
| 422 | Unprocessable Entity - App not installed or wrong type |

## Prerequisites

```yaml
steps:
  - id: get_app_assignments
    description: "Find an installed import_clients app for the business"
    method: GET
    path: "/v3/apps/app_assignments"
    params:
      business_uid: "{{business_id}}"
    extract:
      app_code_name: "$.data.app_assignments[0].app_code_name"
    expect:
      status: [200]
    onFail: abort
```

## UID Resolution Procedure

| UID Field | Source Endpoint | Extract Path | Notes |
|-----------|-----------------|--------------|-------|
| app_code_name | GET /v3/apps/app_assignments | $.data.app_assignments[0].app_code_name | Must be an import_clients app installed for the business |

### Resolution Steps

**app_code_name**:
1. Call `GET /v3/apps/app_assignments?business_uid={{business_id}}`
2. Extract `$.data.app_assignments[0].app_code_name` from response
3. Ensure the app has `app_type=import_clients` - other app types will be rejected

## Test Request

```yaml
steps:
  - id: import_clients
    description: "Trigger client import via installed app"
    method: POST
    path: "/business/clients/v1/apps/{{app_code_name}}/import"
    body:
      import_params:
        should_override: false
        upload_type: "single"
      fields_mapping:
        first_name: "John"
        email: "john.import@example.com"
        phone: "+15551234567"
    expect:
      status: [200, 201]
```

## Parameters Reference

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| app_code_name | string | Yes | Code name of an installed import_clients app for the business |

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| import_params | object | No | Import configuration options |
| import_params.should_override | boolean | No | Whether to override existing client data (default: false) |
| import_params.upload_type | string | No | Upload type (e.g., "single") |
| import_params.send_notifications_when_done | boolean | No | Send notifications when import completes (default: true) |
| fields_mapping | object | No | Mapping of client fields (first_name, email, phone) |

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| app_code_name validation | App must be assigned to business | App must be installed AND of type import_clients - mere assignment is insufficient | modules/clients/app/components/apps/app_import_api.rb:44-51 |

## Critical Learnings

1. **App must be installed, not just assigned** - The API checks `get_installed_apps_for_business` with filter `app_type=import_clients`
2. **authofdirectory won't work** - It's assigned but not an import_clients type app
3. **send_notifications_when_done defaults to true** - Set to false for testing to avoid sending emails
