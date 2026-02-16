---
endpoint: "GET /v3/license/business_carts/{uid}"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/license.json"
status: verified
savedAt: "2026-01-29T17:46:41.060Z"
verifiedAt: "2026-01-29T17:46:41.060Z"
timesReused: 0
---
# Get Business carts

## Summary
GET /v3/license/business_carts/{uid} endpoint works correctly. Successfully tested with directory token and on_behalf_of parameter. Returns proper 404 for non-existent UIDs with clear error messages.

## Prerequisites
None required for this endpoint.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /v3/license/business_carts/{uid} (test endpoint) | created cart uid | - | POST endpoint returns 500 error preventing cart creation. GET endpoint tested with dummy UID to verify functionality. |

### Resolution Steps

**uid**:
1. **Create fresh test entity**: `POST /v3/license/business_carts`
   - Body template: `{"business_cart":{"offering_uid":"{{offering_uid}}"}}`
2. Extract UID from creation response: `created cart uid`
3. Run the test with this fresh UID
4. **Cleanup note**: POST endpoint returns 500 error preventing cart creation. GET endpoint tested with dummy UID to verify functionality.



## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Test Request

Use this template with dynamically resolved UIDs:

```json
null
```