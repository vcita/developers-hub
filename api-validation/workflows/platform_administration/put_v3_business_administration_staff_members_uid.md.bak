---
endpoint: PUT /v3/business_administration/staff_members/{uid}
domain: platform_administration
tags: [staff-only]
status: success
savedAt: 2026-01-30T12:00:00.000Z
verifiedAt: 2026-01-30T12:00:00.000Z
timesReused: 0
---
# Update Staff Member (Staff Token)

## Summary
This endpoint allows staff members to update their own profile information using a Staff token. The `uid` must be the staff member's own UID (extracted from the token context or retrieved via GET endpoint).

## Prerequisites
- Must use a **staff** token (not directory or app token)
- The `uid` in the path must match the authenticated staff member's UID

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /v3/business_administration/staff_members/{uid} (using "me" or token context) | data.uid | - | Staff members are persistent - no cleanup needed |

### Resolution Steps

**uid** (for Staff token):
1. Call `GET /platform/v1/businesses/{business_id}/staffs` with the appropriate headers
2. Extract from response: `data.staff[0].id` (for the first staff member) or use the staff member associated with the current token
3. Alternative: If token context provides staff_uid, use that directly

```json
{
  "uid": {
    "source_endpoint": "GET /platform/v1/businesses/{business_id}/staffs",
    "extract_from": "data.staff[0].id",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Staff members are persistent business entities - cleanup not needed for testing"
  }
}
```

## How to Resolve Parameters
1. Use `staff` token type
2. Resolve `uid` by calling the GET staffs endpoint first to obtain a valid staff member UID

## Critical Learnings

- **Staff token required**: This endpoint is designed for staff members to update their own profile
- **Own UID only**: Staff members can only update their own profile - the uid must match the authenticated user
- **Empty body allowed**: The endpoint accepts an empty JSON body `{}` for testing, which returns 200 OK without making changes
- **Optional fields**: All fields in the request body are optional - only include fields that need updating

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "PUT",
  "path": "/v3/business_administration/staff_members/{{resolved.uid}}",
  "token_type": "staff",
  "body": {
    "first_name": "Updated",
    "display_name": "Updated Display Name"
  }
}
```

## Minimal Test Body

For validation testing, use an empty body or minimal body:

```json
{}
```

or

```json
{
  "display_name": "Test Update"
}
```

## Notes

- All request body fields are optional
- Backend-managed fields (uid, business_uid, created_at, updated_at) are read-only and should not be included in the request
- The `email` field may trigger additional validation or notifications if changed
