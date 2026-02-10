---
endpoint: POST /business/clients/v1/contacts/{client_uid}/matters
domain: clients
tags: []
status: success
savedAt: 2026-01-26T05:14:49.775Z
verifiedAt: 2026-01-26T05:14:49.775Z
timesReused: 0
---
# Create Matters

## Summary
Matter creation succeeded after using correct field UID and valid name value. The original request failed because: 1) It used an incorrect field UID (02tnghfvvfgqv1ib instead of wrytui9q48as6ovw for the name field), 2) The value "test_string" may not meet validation requirements.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| client_uid | Already available in config | config.params.client_uid | - | Using existing client from config |
| field_uid_for_name | GET /business/clients/v1/contacts/{client_uid}/matters | data.matters[0].fields[0].uid (name field) | - | Found name field UID from existing matters: wrytui9q48as6ovw |

### Resolution Steps

**client_uid**:
1. Call `Already available in config`
2. Extract from response: `config.params.client_uid`

**field_uid_for_name**:
1. Call `GET /business/clients/v1/contacts/{client_uid}/matters`
2. Extract from response: `data.matters[0].fields[0].uid (name field)`

```json
{
  "client_uid": {
    "source_endpoint": "Already available in config",
    "extract_from": "config.params.client_uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Using existing client from config"
  },
  "field_uid_for_name": {
    "source_endpoint": "GET /business/clients/v1/contacts/{client_uid}/matters",
    "extract_from": "data.matters[0].fields[0].uid (name field)",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Found name field UID from existing matters: wrytui9q48as6ovw"
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
          "value": "New Matter Name"
        }
      ],
      "note": "test_string",
      "tags": [
        "test_string"
      ]
    }
  }
}
```