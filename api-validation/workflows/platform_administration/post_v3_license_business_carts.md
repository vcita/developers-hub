---
endpoint: POST /v3/license/business_carts
domain: platform_administration
tags: []
status: pass
savedAt: 2026-01-23T21:22:49.779Z
verifiedAt: 2026-01-23T21:22:49.779Z
timesReused: 0
---
# Create Business carts

## Summary
Successfully created a BusinessCart after resolving the required offering_uid. The endpoint returned HTTP 201 with valid business cart data.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| offering_uid | GET /v3/license/offerings | POST /v3/license/offerings | No |

```json
{
  "offering_uid": {
    "source_endpoint": "GET /v3/license/offerings",
    "resolved_value": "1041207f-f572-42bd-a430-5198c27f87f4",
    "used_fallback": false,
    "fallback_endpoint": "POST /v3/license/offerings"
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
  "path": "/v3/license/business_carts",
  "body": {
    "business_cart": {
      "offering_uid": "1041207f-f572-42bd-a430-5198c27f87f4"
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| offering_uid | The documentation or swagger should clearly indicate that offering_uid is required and must be a valid UUID string. The original test had null value which caused validation error. | Update swagger schema to mark offering_uid as required and specify format as UUID string with example value | major |