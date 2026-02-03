---
endpoint: POST /platform/v1/businesses/{business_uid}/staffs
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-29T08:58:08.693Z
verifiedAt: 2026-01-29T08:58:08.693Z
timesReused: 0
---
# Create Staff Member

## Summary
Creates a new staff member for a business. The email must be unique across the entire platform.

## Prerequisites
- Valid business_uid
- Staff, Application, or Directory token with appropriate permissions

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| business_uid | GET /platform/v1/businesses | data.businesses[0].uid | No | N/A |
| staff.email | N/A - generated dynamically | N/A | Yes | Staff must be deleted after test |

### Resolution Steps

**business_uid**:
1. Call `GET /platform/v1/businesses`
2. Extract from response: `data.businesses[0].uid`

**staff.email**:
- MUST be unique - generate using timestamp: `test.staff.{Date.now()}@example.com`
- Emails are globally unique across the platform
- Duplicate emails will return 400 error: "staff.email already in use"

```json
{
  "business_uid": {
    "source_endpoint": "GET /platform/v1/businesses",
    "extract_from": "data.businesses[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Use existing business"
  },
  "staff.email": {
    "source_endpoint": null,
    "extract_from": null,
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": "DELETE /platform/v1/businesses/{business_uid}/staffs/{staff_uid}",
    "cleanup_note": "UNIQUE CONSTRAINT: Email must be generated with timestamp to avoid conflicts"
  }
}
```

## How to Resolve Parameters
- business_uid: Resolved from test config or via GET /platform/v1/businesses
- staff.email: **AUTO-GENERATED with timestamp** - the AI param generator will automatically append a timestamp to ensure uniqueness

## Critical Learnings

1. **Email uniqueness is platform-wide**: The same email cannot be used for multiple staff members even across different businesses.
2. **Error message**: "staff.email already in use" indicates a duplicate email.
3. **Token permissions**: Staff, Application, and Directory tokens can create staff members.

## Request Template

Use this template with dynamically resolved UIDs:

**CRITICAL**: The email field MUST be unique. The validator automatically generates unique emails with timestamps.

```json
{
  "method": "POST",
  "path": "/platform/v1/businesses/{business_uid}/staffs",
  "body": {
    "meta": {
      "invite": false
    },
    "staff": {
      "display_name": "Test Staff",
      "email": "test.staff.{timestamp}@example.com",
      "first_name": "Test",
      "last_name": "Staff",
      "role": "user"
    }
  }
}
```

**Note**: The `{timestamp}` placeholder is automatically replaced with `Date.now()` (e.g., `test.staff.1738135123456@example.com`) to ensure each test run uses a unique email.