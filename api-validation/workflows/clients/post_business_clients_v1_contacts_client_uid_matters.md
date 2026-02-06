---
endpoint: "POST /business/clients/v1/contacts/{client_uid}/matters"
domain: clients
tags: [matters, contacts, create]
swagger: swagger/clients/legacy/manage_clients.json
status: verified
savedAt: 2026-02-06T14:23:41.081Z
verifiedAt: 2026-02-06T14:23:41.081Z
timesReused: 0
---
# Create Matter

## Summary

Creates a new Matter for an existing contact. The request body must include a `matter.fields` array with at least the matter **name** field, whose `uid` is a dynamic field definition ID obtained from `GET /platform/v1/fields` (filter by `type=name` and `object_type=matter`).

**Token Type**: This endpoint requires a **Staff token**.

## Response Codes

| Status | Meaning |
|--------|---------|
| 201 | Success - Matter created |
| 422 | Unprocessable Entity - Validation failed (e.g., missing name field) |
| 500 | Internal Server Error - May occur if request body is empty or malformed |

## Prerequisites

```yaml
steps:
  - id: get_client
    description: "Fetch a client to create a matter for"
    method: GET
    path: "/platform/v1/clients"
    params:
      per_page: "1"
    extract:
      client_uid: "$.data.clients[0].uid"
    expect:
      status: 200
    onFail: abort

  - id: get_fields
    description: "Fetch field definitions to find the matter name field UID"
    method: GET
    path: "/platform/v1/fields"
    extract:
      matter_name_field_uid: "$.data[?(@.type=='name' && @.object_type=='matter')].id"
    expect:
      status: 200
    onFail: abort
```

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Extract Path | Notes |
|-----------|-----------------|--------------|-------|
| client_uid | GET /platform/v1/clients | $.data.clients[0].uid | Path parameter - the contact UID |
| matter_name_field_uid | GET /platform/v1/fields | $.data[?(@.type=='name' && @.object_type=='matter')].id | Required field UID for the matter name |

### Resolution Steps

**client_uid:**
1. Call `GET /platform/v1/clients?per_page=1`
2. Extract `$.data.clients[0].uid` from response
3. If empty, endpoint cannot be tested (skip with reason)

**matter_name_field_uid:**
1. Call `GET /platform/v1/fields`
2. Find the element where `type == "name"` AND `object_type == "matter"`
3. Use its `id` value as the `uid` in `matter.fields`

## Test Request

```yaml
steps:
  - id: main_request
    description: "Create a new matter for a contact"
    method: POST
    path: "/business/clients/v1/contacts/{{client_uid}}/matters"
    body:
      matter:
        fields:
          - uid: "{{matter_name_field_uid}}"
            value: "API Test Matter {{timestamp}}"
    expect:
      status: [201]
```

## Parameters Reference

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| client_uid | string | Yes | The UID of the contact (client) to create the matter for. Internally mapped to `contact_uid`. |

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| matter | object | Yes | The matter object containing fields, tags, and note |
| matter.fields | array | Yes | Array of field objects. Must include at least the name field. |
| matter.fields[].uid | string | Yes | Dynamic field definition UID from `GET /platform/v1/fields` |
| matter.fields[].value | string | Yes | Value for the field |
| matter.tags | array | No | Tags to attach to the matter |
| matter.note | string | No | A note to attach to the matter |

## Critical Learnings

1. **Dynamic field UIDs**: The `uid` in `matter.fields` is NOT a static identifier. It must be resolved at runtime by calling `GET /platform/v1/fields` and finding the field with `type=name` and `object_type=matter`.
2. **Name field is required**: Creating a matter without the name field in `matter.fields` returns a 422 error with `missing_field` for `name`.
3. **Path param naming**: The swagger path uses `{client_uid}` but the backend controller reads it as `contact_uid`. Both refer to the same value - the contact's UID.
4. **First matter auto-created**: When a client is created via `POST /platform/v1/clients`, a first matter is auto-created. This endpoint is for creating additional matters.

## Notes

- The `matter.fields` array can include other custom matter fields beyond the required name field
- Tags should be passed as an array of strings, not comma-separated
- The response wraps the created matter in `data.matter`
