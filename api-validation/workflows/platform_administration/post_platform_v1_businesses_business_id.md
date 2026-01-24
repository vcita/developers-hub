---
endpoint: POST /platform/v1/businesses/{business_id}
domain: platform_administration
tags: []
status: pass
savedAt: 2026-01-23T22:46:03.698Z
verifiedAt: 2026-01-23T22:46:03.698Z
timesReused: 0
---
# Create Businesses

## Summary
Successfully updated business after resolving multiple validation issues. The original error "Business is missing" was misleading - the actual issues were validation errors that only became clear when using the correct token type (directory token) and making specific fixes.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| business_id | already resolved | - | No |
| external_id | provided in request | - | No |
| external_reference_id | provided in request | - | No |

```json
{
  "business_id": {
    "source_endpoint": "already resolved",
    "resolved_value": "z17uw5xqe4idicj5",
    "used_fallback": false
  },
  "external_id": {
    "source_endpoint": "provided in request",
    "resolved_value": "smith.legal.unique.test3",
    "used_fallback": false
  },
  "external_reference_id": {
    "source_endpoint": "provided in request",
    "resolved_value": "ext_ref_unique_1234567",
    "used_fallback": false
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
  "path": "/platform/v1/businesses/z17uw5xqe4idicj5",
  "body": {
    "business": {
      "business": {
        "address": "123 Main Street, Anytown, CA 90210",
        "business_category": "aeroclub",
        "business_maturity_in_years": "2+",
        "country_name": "United States",
        "hide_address": false,
        "name": "Smith Updated Services",
        "phone": "+1-555-987-6543",
        "scheduling_disabled": false,
        "short_description": "Professional services for individuals and businesses",
        "time_zone": "Mountain Time (US & Canada)",
        "website_url": "https://www.smithlegal.com"
      }
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| token_type | Documentation doesn't specify that directory token is required for business updates. Staff token returns 'Unauthorized' error. | Add note in swagger that directory-level permissions are required for business updates | major |
| business_category | Documentation says 'Legal Services' should be valid but API requires profession_code from Profession model (e.g., 'aeroclub'). Error message is unclear. | Document the valid business_category values or provide enum list in swagger. Improve error message to list valid options. | critical |
| admin_account.email | Email uniqueness constraint not documented. API returns 'admin_account.email already in use' without mentioning this requirement. | Document that admin_account.email must be unique across the system | major |
| logo_url and image URLs | Image URLs are validated by attempting download. 404 errors from invalid URLs cause request to fail, but this validation behavior is not documented. | Document that image URLs must be publicly accessible and return 200 status | major |
| meta.plan | Plan changes have authorization restrictions ('External party can change plan only for direct accounts') but this business rule is not documented. | Document plan modification restrictions and required account types | major |
| error_message | Original error 'Business is missing' is misleading when the actual issue is authorization or validation failures. | Improve error messages to be more specific about the actual validation failures | critical |