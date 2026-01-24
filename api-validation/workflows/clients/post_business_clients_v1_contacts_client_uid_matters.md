---
endpoint: POST /business/clients/v1/contacts/{client_uid}/matters
domain: clients
tags: []
status: pass
savedAt: 2026-01-23T21:58:07.472Z
verifiedAt: 2026-01-23T21:58:07.472Z
timesReused: 0
---
# Create Matters

## Summary
Successfully created a matter after correcting the field UID. The original request failed because it used wrong field UID (cf7ljj1o7i2mr8y2) instead of the required Matter Name field UID (vhtqkoqryniis3yv).

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| client_uid | Already available in parameters | - | No |
| name_field_uid | GET /platform/v1/fields | - | Yes |
| additional_field_uid | GET /platform/v1/fields | - | Yes |

```json
{
  "client_uid": {
    "resolved_value": "2l2ut3opxv7heqcq",
    "source_endpoint": "Already available in parameters",
    "used_fallback": false
  },
  "name_field_uid": {
    "resolved_value": "vhtqkoqryniis3yv",
    "source_endpoint": "GET /platform/v1/fields",
    "used_fallback": true
  },
  "additional_field_uid": {
    "resolved_value": "cc6vney5o1nodx7a",
    "source_endpoint": "GET /platform/v1/fields",
    "used_fallback": true
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/business/clients/v1/contacts/2l2ut3opxv7heqcq/matters",
  "body": {
    "matter": {
      "fields": [
        {
          "uid": "vhtqkoqryniis3yv",
          "value": "Test Matter Name 12345"
        },
        {
          "uid": "cc6vney5o1nodx7a",
          "value": "Updated field value"
        }
      ],
      "note": "Initial matter creation note",
      "tags": [
        "litigation",
        "corporate"
      ]
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| matter.fields[].uid | Documentation shows example field UID as 'cf7ljj1o7i2mr8y2' but the actual required field UID for Matter Name is 'vhtqkoqryniis3yv'. The example uses a field UID that doesn't correspond to the required Matter Name field. | Update the documentation example to use the correct field UID 'vhtqkoqryniis3yv' for the Matter Name field, or clarify that field UIDs need to be fetched from GET /platform/v1/fields first. | critical |
| matter.fields structure | The error message 'Matter Name can't be blank' with field ID 'vhtqkoqryniis3yv' indicates that this field is actually required for matter creation, but this requirement is not clearly documented in the swagger specification. | Update documentation to clearly indicate that a field with type 'name' (Matter Name) is required when creating a matter, and show how to obtain the correct field UID. | major |