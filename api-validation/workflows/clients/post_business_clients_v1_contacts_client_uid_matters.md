---
endpoint: POST /business/clients/v1/contacts/{client_uid}/matters
domain: clients
tags: []
status: success
savedAt: 2026-02-02T20:57:12.041Z
verifiedAt: 2026-02-02T20:57:12.041Z
timesReused: 0
---
# Create Matters

## Summary
Successfully created matter after discovering the real name field UID from GET /platform/v1/fields. The endpoint requires the actual field UID for the name field (type='name', object_type='matter'), not a placeholder.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| name_field_uid | GET /platform/v1/fields | find item where type='name' AND object_type='matter' then use id field | - | Field is a business configuration, no cleanup needed |

### Resolution Steps

**name_field_uid**:
1. Call `GET /platform/v1/fields`
2. Extract from response: `find item where type='name' AND object_type='matter' then use id field`

```json
{
  "name_field_uid": {
    "source_endpoint": "GET /platform/v1/fields",
    "extract_from": "find item where type='name' AND object_type='matter' then use id field",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Field is a business configuration, no cleanup needed"
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
  "path": "/business/clients/v1/contacts/{{resolved.uid}}/matters",
  "body": {
    "matter": {
      "fields": [
        {
          "uid": "{{resolved.uid}}",
          "value": "Additional Matter - 1738529715510"
        }
      ]
    }
  }
}
```

## Code Analysis

Source code exploration results from the healing process:

**Service**: core
**Controller**: modules/clients/app/controllers/business/clients/v1/matters_controller.rb (lines 36-42)
**DTO/Model**: modules/clients/app/models/matter.rb (lines 44-56)


## Discrepancies Found

Differences between swagger documentation and actual code:

| Aspect | Field | Swagger Says | Code Says | Evidence |
|--------|-------|--------------|-----------|----------|
| required_field | name_field | does not mention name field requirement | requires a name field for additional matters - field with type='name' | - |
| validation_rule | matter.fields | does not specify validation for name field requirement | field validation requires name field for additional matters | - |


## Swagger Changes Required

Documentation changes needed based on code analysis:

### 1. matter.fields

- **File**: swagger/clients/matters.json
- **Change Type**: fix_description
- **Current**: Basic mention of GET /platform/v1/fields call
- **Should be**: Explicit requirement for name field with filtering instructions
- **Evidence**: modules/clients/app/models/matter.rb:44-45
  ```
  matter_name = custom_fields.select{|cf| cf[:type] == 'name'}.map{|cf| cf[:value]}.first
  ```

### 2. matter.fields[].uid

- **File**: swagger/clients/matters.json
- **Change Type**: fix_description
- **Current**: Shows placeholder 'name_field_uid_placeholder'
- **Should be**: Show actual API resolution sequence or dynamic lookup
- **Evidence**: modules/clients/spec/components/matters_api_spec.rb:70-72
  ```
  fields << { uid: @name[:id], value: "matter name #{Time.now.to_f}" }
  ```


## Workflow Changes Required

1. **prerequisites**: Add step to resolve name field UID from GET /platform/v1/fields
   - Evidence: GET /platform/v1/fields API - Must filter by object_type=matter and type=name to get the required field UID
2. **uid_resolution**: Document name_field_uid resolution procedure
   - Evidence: modules/clients/spec/components/matters_api_spec.rb:39 - Tests create name field and reference it by ID in matter creation
