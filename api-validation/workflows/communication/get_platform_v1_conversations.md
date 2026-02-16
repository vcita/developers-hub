---
endpoint: "GET /platform/v1/conversations"
domain: communication
tags: [conversations, messaging]
swagger: "swagger/communication/legacy/legacy_v1_communication.json"
status: verified
savedAt: 2026-02-08T21:43:45.000Z
verifiedAt: 2026-02-13T00:00:00.000Z
timesReused: 0
useFallbackApi: true
tokens: [staff, directory]
---

# Get All Conversations

## Summary

Retrieves a list of all conversations for the current business. This endpoint forwards requests to the Conversations API and returns all conversations associated with the business.

**Token Type**: This endpoint requires a **Staff token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL (`/api2`). The main API gateway (`/apigw`) returns 422 Unauthorized due to authentication context differences between the gateways.

## Response Codes

| Status | Meaning |
|--------|---------| 
| 200 | Success - Conversations retrieved |
| 422 | Unprocessable Entity - Upstream error (includes Unauthorized) |

## Authentication

Available for **Staff and Directory** tokens.

| Token Type | Works | Notes |
|------------|-------|-------|
| Staff | ✅ | Requires staff to be associated with a business |
| Directory | ✅ | Requires `X-On-Behalf-Of` header with business UID |
| App | ❌ | Returns 422 Unauthorized - `authorize_action` only accepts `user` and `admin` types |
| Internal | ✅ | Full access (admin type) |

## Test Request

```yaml
steps:
  - id: get_conversations
    description: "Get all conversations for the business"
    method: GET
    path: "/platform/v1/conversations"
    expect:
      status: [200]
```

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| per_page | integer | No | Results per page (default: 25, max: 50) |

## Known Issues

### Issue: 422 Unauthorized via Primary Gateway

**Description**: Requests via the primary API gateway (`/apigw`) return 422 with `{status: "Error", error: "Unauthorized"}`, but the same request succeeds via fallback (`/api2`).

**Root Cause**: The controller renders any non-"OK" upstream response as HTTP 422. The gateway routing/auth context differs between `/apigw` and `/api2`, causing the upstream Conversations API to return Unauthorized through the primary gateway.

**Workaround**: Use the fallback API URL (`useFallbackApi: true` in workflow).

## Critical Learnings

1. **Gateway Routing Matters**: The endpoint works via `/api2` but fails via `/apigw` with the same token
2. **422 Is Overloaded**: The controller uses 422 for all error responses including Unauthorized  
3. **Business Context Required**: The business context is derived from `current_user.staff.business.uid` - if the token user isn't a staff with a business, it causes upstream Unauthorized

## Notes

- The controller forwards requests to `Components::ConversationsAPI.get_conversations`
- All non-OK upstream responses are wrapped as 422, losing the original HTTP status
- Returns conversations for all clients within the business scope