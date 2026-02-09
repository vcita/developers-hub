---
endpoint: "GET /v3/license/subscriptions/{uid}"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/license.json"
status: verified
savedAt: "2026-01-28T14:29:42.984Z"
verifiedAt: "2026-01-28T14:29:42.984Z"
timesReused: 0
---
# Get Subscriptions

## Summary
Endpoint works correctly with proper token. The original error was due to authentication token being incorrectly treated as an app token for 'appwidgetsmanager'.

## Prerequisites
None required for this endpoint.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /v3/license/subscriptions | first subscription uid from list or created subscription uid | - | No DELETE endpoint available |

### Resolution Steps

**uid**:
1. **Create fresh test entity**: `POST /v3/license/subscriptions`
   - Body template: `{"offering_uid":"9e50084f-094e-4525-9886-8ad5b4e62037","business_uid":"88pzdbz1hmkdoel4","purchase_currency":"USD"}`
2. Extract UID from creation response: `first subscription uid from list or created subscription uid`
3. Run the test with this fresh UID
4. **Cleanup**: `No DELETE endpoint available`



## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Test Request

Use this template with dynamically resolved UIDs:

```json
null
```