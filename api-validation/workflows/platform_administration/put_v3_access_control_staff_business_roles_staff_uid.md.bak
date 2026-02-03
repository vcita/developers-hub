---
endpoint: PUT /v3/access_control/staff_business_roles/{staff_uid}
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-28T11:50:24.410Z
verifiedAt: 2026-01-28T11:50:24.410Z
timesReused: 0
---
# Update Staff business roles

## Summary
Endpoint works correctly. The 403 error occurred because the test tried to update the business role of the business owner, which is not allowed by business logic. Successfully updated a non-owner staff member's business role.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| staff_uid | GET /platform/v1/businesses/{business_id}/staffs | data.staff[0].id for owner, data.staff[1].id for non-owner | - | No cleanup needed - staff members are persistent test data |
| business_role_uid | GET /v3/access_control/business_roles | data.business_roles[0].uid | - | No cleanup needed - business roles are persistent test data |

### Resolution Steps

**staff_uid**:
1. Call `GET /platform/v1/businesses/{business_id}/staffs`
2. Extract from response: `data.staff[0].id for owner, data.staff[1].id for non-owner`

**business_role_uid**:
1. Call `GET /v3/access_control/business_roles`
2. Extract from response: `data.business_roles[0].uid`

```json
{
  "staff_uid": {
    "source_endpoint": "GET /platform/v1/businesses/{business_id}/staffs",
    "extract_from": "data.staff[0].id for owner, data.staff[1].id for non-owner",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - staff members are persistent test data"
  },
  "business_role_uid": {
    "source_endpoint": "GET /v3/access_control/business_roles",
    "extract_from": "data.business_roles[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - business roles are persistent test data"
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
  "path": "/v3/access_control/staff_business_roles/{{resolved.uid}}",
  "body": {
    "business_role_uid": "{{resolved.business_role_uid}}"
  }
}
```