---
endpoint: "GET /platform/v1/clients/{client_id}/conversations"
domain: communication
tags: [conversations, messaging]
swagger: "mcp_swagger/communication.json"
status: verified
savedAt: "2026-02-04T08:30:00.000Z"
verifiedAt: "2026-02-04T08:30:00.000Z"
timesReused: 0
useFallbackApi: true
tokens: [staff]
---

# Get Client Conversations

## Summary

Retrieves a list of conversations for a specific client. This endpoint forwards requests to the Conversations API and returns all conversations associated with the given client UID.

**Token Type**: This endpoint requires a **Staff token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL (`/api2`). The main API gateway (`/apigw`) returns 422 Unauthorized due to authentication context differences between the gateways.

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Conversations retrieved |
| 422 | Unprocessable Entity - Upstream error (includes Unauthorized) |

## Authentication

Available for **Staff** tokens.

| Token Type | Works | Notes |
|------------|-------|-------|
| Staff | ✅ | Requires staff to be associated with a business |
| App | ⚠️ | May fail via apigw, use fallback |
| Directory | ⚠️ | May fail via apigw, use fallback |

## Prerequisites

```yaml
steps:
  - id: get_client
    description: "Fetch a client with conversations"
    method: GET
    path: "/platform/v1/clients"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_id: "$.data.clients[0].id"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_conversations
    description: "Get conversations for the client"
    method: GET
    path: "/platform/v1/clients/{{client_id}}/conversations"
    expect:
      status: [200]
```

## Parameters Reference

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| client_id | string | Yes | Client UID |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| per_page | integer | No | Results per page (default: 25, max: 50) |

## Known Issues

### Issue: 422 Unauthorized via Primary Gateway

**Description**: Requests via the primary API gateway (`/apigw`) return 422 with `{status: "Error", error: "Unauthorized"}`, but the same request succeeds via fallback (`/api2`).

**Root Cause**: The controller at `app/controllers/platform/v1/conversations_controller.rb` renders any non-"OK" upstream response as HTTP 422. The gateway routing/auth context differs between `/apigw` and `/api2`, causing the upstream Conversations API to return Unauthorized through the primary gateway.

**Code Reference**:
```ruby
# app/controllers/platform/v1/conversations_controller.rb:15-21
response = ::Components::ConversationsAPI.get_conversations(...)
if response['status'] == 'OK'
  render json: response, status: 200
else
  render json: response, status: 422  # All non-OK responses become 422
end
```

**Workaround**: Use the fallback API URL (`useFallbackApi: true` in workflow).

## Critical Learnings

1. **Gateway Routing Matters**: The endpoint works via `/api2` but fails via `/apigw` with the same token
2. **422 Is Overloaded**: The controller uses 422 for all error responses including Unauthorized
3. **Business Context Required**: The `business_uid` is derived from `current_user.staff.business.uid` - if the token user isn't a staff with a business, it becomes nil and causes upstream Unauthorized

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| Error responses | Not documented | Returns 422 with `{status: "Error", error: "Unauthorized"}` | Observed via API call |
| Token types | Staff, App, Directory | Only Staff works reliably via fallback | Gateway auth context issues |

## Notes

- The controller forwards requests to `Components::ConversationsAPI.get_conversations`
- The `client_id` path parameter is passed as `filters[:by_client]` to the upstream API
- All non-OK upstream responses are wrapped as 422, losing the original HTTP status
