---
endpoint: GET /v3/business_administration/staff_members/{uid}
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-28T11:39:26.180Z
verifiedAt: 2026-01-28T11:39:26.180Z
timesReused: 0
---
# Get Staff members

## Summary
GET /v3/business_administration/staff_members/{uid} works correctly when provided with a valid staff member UID. The original test failed because it used a non-existent UID value (5bcebdb0-36ab-4002-9b05-3b964244b2cf). Using a valid staff UID (g7n82lrc4ztic4cp) returns the expected staff member data with a 200 status.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /platform/v1/businesses/{business_id}/staffs | data.staff[0].id | - | DELETE /platform/v1/businesses/{business_id}/staffs/{uid} |

### Resolution Steps

**uid**:
1. **Create fresh test entity**: `POST /platform/v1/businesses/{business_id}/staffs`
   - Body template: `{"first_name":"Test","last_name":"Staff {{timestamp}}","email":"test-staff-{{timestamp}}@example.com","role":"user"}`
2. Extract UID from creation response: `data.staff[0].id`
3. Run the test with this fresh UID
4. **Cleanup**: `DELETE /platform/v1/businesses/{business_id}/staffs/{uid}`

```json
{
  "uid": {
    "source_endpoint": "GET /platform/v1/businesses/{business_id}/staffs",
    "extract_from": "data.staff[0].id",
    "fallback_endpoint": "POST /platform/v1/businesses/{business_id}/staffs",
    "create_fresh": false,
    "create_endpoint": "POST /platform/v1/businesses/{business_id}/staffs",
    "create_body": {
      "first_name": "Test",
      "last_name": "Staff {{timestamp}}",
      "email": "test-staff-{{timestamp}}@example.com",
      "role": "user"
    },
    "cleanup_endpoint": "DELETE /platform/v1/businesses/{business_id}/staffs/{uid}",
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
  "method": "GET",
  "path": "/v3/business_administration/staff_members/{{resolved.uid}}"
}
```