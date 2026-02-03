---
endpoint: POST /v3/license/directory_offerings
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-30T12:00:00.000Z
verifiedAt: 2026-01-30T12:00:00.000Z
timesReused: 0
---
# Create Directory Offerings

## Summary
Creates a DirectoryOffering linking a directory to an offering. Since each directory can only have one DirectoryOffering per `offering_uid` (uniqueness constraint), this workflow **MUST create a fresh offering first** to guarantee no duplication errors.

## Prerequisites
- Admin token required for all steps
- Directory token required (to get directory_uid)

## ⚠️ IMPORTANT: Multi-Step Workflow

This endpoint requires creating a fresh offering BEFORE calling the main endpoint to avoid "already exists" errors. The test harness MUST execute these steps in order.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| directory_uid | GET /platform/v1/directory/branding | data.uid | No | - |
| offering_uid | - | - | **Yes - REQUIRED** | DELETE /v3/license/offerings/{uid} |

### Resolution Steps

**Step 1: Get directory_uid**
1. Call `GET /platform/v1/directory/branding` with directory token
2. Extract from response: `data.uid`

**Step 2: Create a fresh offering (REQUIRED - to avoid duplication)**
1. Call `POST /v3/license/offerings` with admin token
2. Request body (see below)
3. Extract from response: `data.uid` (this is the new offering_uid)
4. This guarantees a unique offering_uid that doesn't already have a DirectoryOffering for this directory

**Step 3: Create the DirectoryOffering**
1. Call `POST /v3/license/directory_offerings` with the directory_uid and fresh offering_uid
2. Result: 201 Created

## UID Resolution

```json
{
  "directory_uid": {
    "source_endpoint": "GET /platform/v1/directory/branding",
    "token_type": "directory",
    "extract_from": "data.uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": null
  },
  "offering_uid": {
    "source_endpoint": null,
    "token_type": "admin",
    "extract_from": "data.uid",
    "fallback_endpoint": null,
    "create_fresh": true,
    "create_endpoint": "POST /v3/license/offerings",
    "create_body": {
      "type": "addon",
      "SKU": "sms",
      "display_name": "test-offering-for-directory-{{timestamp}}",
      "quantity": 100,
      "payment_type": "monthly",
      "is_active": true,
      "vendor": "inTandem",
      "prices": [
        {"price": 5.00, "currency": "USD"}
      ],
      "trial": 14,
      "reporting_tags": ["business-management"]
    },
    "cleanup_endpoint": "DELETE /v3/license/offerings/{uid}",
    "cleanup_note": "Delete the test offering after test to avoid accumulating test data"
  }
}
```

## How to Resolve Parameters

1. **directory_uid**: Get from `GET /platform/v1/directory/branding` (directory token)
2. **offering_uid**: **MUST** Create fresh via `POST /v3/license/offerings` (admin token) - do NOT use an existing offering_uid

## Critical Learnings

- **Uniqueness Constraint**: Each directory can only have one DirectoryOffering per `offering_uid`. The combination of `directory_uid` and `offering_uid` must be unique.
- **ALWAYS Create Fresh Offering**: Do NOT try to find an existing offering that doesn't have a DirectoryOffering - **ALWAYS** create a fresh offering to guarantee uniqueness.
- **Token Requirements**: 
  - Directory branding: directory token
  - Create offering: admin token
  - Create directory_offering: admin token
- **Error 400 "already exists"**: If you see this error, it means you used an offering_uid that already has a DirectoryOffering for this directory. The solution is to create a NEW offering, not retry with the same offering_uid.

## Request Template

Use this template with dynamically resolved UIDs:

### Step 1: Create Fresh Offering (REQUIRED - Admin Token)

**This step MUST be executed before Step 2.**

```json
{
  "method": "POST",
  "path": "/v3/license/offerings",
  "token_type": "admin",
  "purpose": "uid_resolution",
  "body": {
    "type": "addon",
    "SKU": "sms",
    "display_name": "test-offering-for-directory-{{timestamp}}",
    "quantity": 100,
    "payment_type": "monthly",
    "is_active": true,
    "vendor": "inTandem",
    "prices": [{"price": 5.00, "currency": "USD"}],
    "trial": 14,
    "reporting_tags": ["business-management"]
  }
}
```

Extract `offering_uid` from response: `response.data.uid`

### Step 2: Create Directory Offering (Admin Token)

```json
{
  "method": "POST",
  "path": "/v3/license/directory_offerings",
  "token_type": "admin",
  "purpose": "retry_original",
  "body": {
    "directory_uid": "{{resolved.directory_uid}}",
    "offering_uid": "{{step1.response.data.uid}}"
  }
}
```
