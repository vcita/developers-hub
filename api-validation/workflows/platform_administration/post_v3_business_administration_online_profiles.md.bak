---
endpoint: POST /v3/business_administration/online_profiles
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-29T08:50:12.951Z
verifiedAt: 2026-01-29T08:50:12.951Z
timesReused: 0
---
# Create Online profiles

## Summary
Online profiles are unique per business. To test POST (creation), you must first create a new business (with a business admin) that doesn't have an online profile yet, then create the online profile for that business.

## Prerequisites
- A Directory Token is required to create a new business
- A new business must be created first (one without an existing online profile)
- Use a token scoped to the new business for the online profile creation

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| business_uid | - | - | Yes - create via POST /platform/v1/businesses | DELETE /platform/v1/businesses/{uid} |

### Resolution Steps

**Step 1: Create a new business with admin_account**
1. Call `POST /platform/v1/businesses` with required business data AND admin_account
2. Extract `business_uid` from response: `data.uid`
3. Obtain a token scoped to the new business

**Step 2: Create online profile for the new business**
1. Call `POST /v3/business_administration/online_profiles` using the business-scoped token

```json
{
  "business_uid": {
    "source_endpoint": null,
    "extract_from": null,
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": "POST /platform/v1/businesses",
    "create_body": {
      "admin_account": {
        "email": "test.admin.{{timestamp}}@example.com",
        "first_name": "Test",
        "last_name": "Admin",
        "password": "TestPass123!"
      },
      "business": {
        "name": "Test Business {{timestamp}}"
      }
    },
    "cleanup_endpoint": "DELETE /platform/v1/businesses/{uid}",
    "cleanup_note": "Delete the test business after testing to clean up"
  }
}
```

## How to Resolve Parameters
1. Generate unique email using timestamp to avoid conflicts
2. Create business with admin_account first (requires Directory Token)
3. Obtain a token scoped to the new business
4. Use that token for the online profile creation request

## Critical Learnings

- Online profiles are singleton resources - one per business
- Cannot create an online profile for a business that already has one (returns 422)
- Must create a fresh business to test POST endpoint
- Creating a business requires an `admin_account` with at least an email
- Business creation requires a Directory Token
- Online profiles cannot be deleted - they are updated via PUT

## Request Template

Use this template with a token scoped to the new business:

```json
{
  "online_profile": {
    "display_name": "Test Profile",
    "description": "Test online profile for API validation"
  }
}
```

## Cleanup

After testing, remove the test business to clean up:

**Step 1: Delete the test business**
```
DELETE /platform/v1/businesses/{{business_uid}}
```

Note: The online profile and admin account associated with the business will be automatically cleaned up when the business is deleted.