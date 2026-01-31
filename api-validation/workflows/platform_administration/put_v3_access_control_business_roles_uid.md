---
endpoint: PUT /v3/access_control/business_roles/{uid}
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-28T11:48:22.190Z
verifiedAt: 2026-01-28T11:48:22.190Z
timesReused: 0
---
# Update Business roles

## Summary
Test passes after resolving UID and using valid permission keys. Original test used non-existent permission keys ('read_reports', 'manage_team') which caused validation errors.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| business_role_uid | GET /v3/access_control/business_roles | data.uid | ✓ POST /v3/access_control/business_roles | DELETE /v3/access_control/business_roles/{uid} |
| permissions[].key | GET /v3/access_control/permissions | data.permissions[0].unique_code | - | - |

### Resolution Steps

**business_role_uid**:
1. **Create fresh test entity**: `POST /v3/access_control/business_roles`
   - Body template: `{"name":"Test Role {{timestamp}}","description":"A test role created for testing","permissions":[{"key":"campaigns.manage","allow":true}]}`
2. Extract UID from creation response: `data.uid`
3. Run the test with this fresh UID
4. **Cleanup**: `DELETE /v3/access_control/business_roles/{uid}`

**permissions[].key**:
1. Call `GET /v3/access_control/permissions`
2. Extract from response: `data.permissions[0].unique_code`

```json
{
  "business_role_uid": {
    "source_endpoint": "GET /v3/access_control/business_roles",
    "extract_from": "data.uid",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": "POST /v3/access_control/business_roles",
    "create_body": {
      "name": "Test Role {{timestamp}}",
      "description": "A test role created for testing",
      "permissions": [
        {
          "key": "campaigns.manage",
          "allow": true
        }
      ]
    },
    "cleanup_endpoint": "DELETE /v3/access_control/business_roles/{uid}",
    "cleanup_note": null
  },
  "permissions[].key": {
    "source_endpoint": "GET /v3/access_control/permissions",
    "extract_from": "data.permissions[0].unique_code",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
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
  "method": "PUT",
  "path": "/v3/access_control/business_roles/{{resolved.uid}}",
  "body": {
    "name": "Senior Manager",
    "description": "Senior management role with elevated permissions for business operations and team oversight",
    "permissions": [
      {
        "key": "campaigns.manage",
        "allow": true
      },
      {
        "key": "payments.manage",
        "allow": true
      }
    ]
  }
}
```