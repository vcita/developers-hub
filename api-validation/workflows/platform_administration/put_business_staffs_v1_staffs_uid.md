---
endpoint: PUT /business/staffs/v1/staffs/{uid}
domain: platform_administration
tags: [directory-only]
status: success
savedAt: 2026-01-29T12:00:00.000Z
verifiedAt: 2026-01-29T12:00:00.000Z
timesReused: 0
---
# Update Staff (Directory API)

## Summary
This endpoint is for **Directory tokens only** to update staff members in managed businesses. Staff members who want to update their own details should use `PUT /v3/business_administration/staff_members/{uid}` with a Staff token instead.

## Prerequisites
- Must use a **directory** token (not staff or app token)
- Must include `X-On-Behalf-Of` header with the target business UID

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /platform/v1/businesses/{business_id}/staffs | data.staff[0].id | - | Staff members are persistent business entities - cleanup not needed for testing |

### Resolution Steps

**uid**:
1. Call `GET /platform/v1/businesses/{business_id}/staffs` with directory token and X-On-Behalf-Of header
2. Extract from response: `data.staff[0].id`

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
1. Use `directory` token type
2. Include `X-On-Behalf-Of` header with the business UID from config

## Critical Learnings

- **Directory token required**: This endpoint only works with directory tokens. Staff/App tokens will cause a 500 error.
- **X-On-Behalf-Of required**: The header must contain the business UID to identify which business's staff to update.
- **Minimal body recommended**: Use only `display_name` or other simple fields to avoid validation edge cases.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "PUT",
  "path": "/business/staffs/v1/staffs/{{resolved.uid}}",
  "token_type": "directory",
  "headers": {
    "X-On-Behalf-Of": "{{business_uid}}"
  },
  "body": {
    "staff": {
      "display_name": "Test Staff Updated"
    }
  }
}
```

## Notes

- The `role` field is deprecated - use the Access Control API instead
- The `email` field has special handling for notification preferences - avoid changing unless specifically testing email updates
- At least one name field (display_name, first_name, or last_name) must remain populated after the update
