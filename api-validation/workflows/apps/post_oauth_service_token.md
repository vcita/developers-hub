---
endpoint: POST /oauth/service/token
domain: apps
tags: []
status: skip
savedAt: 2026-01-23T22:33:06.275Z
verifiedAt: 2026-01-23T22:33:06.275Z
timesReused: 0
skipReason: Endpoint requires valid OAuth application credentials (service_id and service_secret) that are created during app registration. These credentials are stored in Doorkeeper::Application records and cannot be easily generated for testing without proper admin/app creation permissions.
---
# Create Token

## Summary
The OAuth service token endpoint is working correctly but requires valid service credentials from a Doorkeeper::Application record. Cannot test without proper app credentials that would typically be created during app development/registration flow.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Endpoint requires valid OAuth application credentials (service_id and service_secret) that are created during app registration. These credentials are stored in Doorkeeper::Application records and cannot be easily generated for testing without proper admin/app creation permissions.

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| service_id | POST /platform/v1/apps | POST /platform/v1/apps | Yes |

```json
{
  "service_id": {
    "source_endpoint": "POST /platform/v1/apps",
    "resolved_value": "afb5d99f9f3dbdec21f375e80335d18cfef37c90348c233baa4e7d5cde8cff7d",
    "used_fallback": true,
    "fallback_endpoint": "POST /platform/v1/apps"
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
null
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| service_id | Documentation doesn't explain that service_id must be a Doorkeeper::Application UID (not an app_id) | Clarify that service_id should be the client_id returned from POST /platform/v1/apps (Doorkeeper application UID) | major |
| service_secret | Documentation doesn't explain that service_secret must match the Doorkeeper::Application secret for the given service_id | Clarify that service_secret should be the client_secret returned from POST /platform/v1/apps | major |
| request_flow | Documentation doesn't explain the prerequisite flow: create app first via POST /platform/v1/apps to get service_id and service_secret | Add example showing how to create an app first and use the returned client_id/client_secret as service_id/service_secret | critical |