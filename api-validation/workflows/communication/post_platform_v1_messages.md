---
endpoint: "POST /platform/v1/messages"
domain: communication
tags: [messages, messaging]
swagger: "swagger/communication/legacy/legacy_v1_communication.json"
status: verified
savedAt: "2026-02-09T07:20:00.000Z"
verifiedAt: "2026-02-09T07:20:00.000Z"
timesReused: 0
tokens: [staff]
useFallbackApi: true
---

# Create Message

## Summary

Creates a new message within a conversation. The endpoint is handled by core's `Platform::V1::MessagesController` which delegates to `Components::MessagingAPI.send_message`. It finds or creates a conversation for the given client and adds the message to it.

**Token Type**: This endpoint requires a **Staff token**.

> **Fallback API Required**
> This endpoint must use the fallback API URL (`/api2`). The main API gateway (`/apigw`) routes to core but may have auth context differences.

## Prerequisites

```yaml
steps:
  - id: get_client
    description: "Verify a client exists for this business"
    method: GET
    path: "/platform/v1/clients"
    params:
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
  - id: create_message
    description: "Create a new message in a conversation"
    method: POST
    path: "/platform/v1/messages"
    body:
      message:
        client_id: "{{client_id}}"
        staff_id: "{{staff_id}}"
        text: "Test message from API validation {{now_timestamp}}"
        direction: "business_to_client"
        channels: "email"
        conversation_title: "API Test Message {{now_timestamp}}"
    expect:
      status: [201]
```

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message.client_id | string | Yes | UID of the client to send the message to |
| message.staff_id | string | No | UID of the staff member sending the message. If omitted, auto-assigned based on conversation |
| message.text | string | Yes | The message text content |
| message.direction | string | No | Message direction: `business_to_client` or `client_to_business`. Defaults based on context |
| message.channels | string | No | Comma-separated delivery channels (e.g., `email`, `sms`, `email,sms`). Defaults to `sms,email` |
| message.conversation_title | string | No | Title for the conversation. Updates existing conversation title if provided |
| message.conversation_uid | string | No | UID of an existing conversation. If omitted, a conversation is found or created for the client |

## Response

```json
{
  "status": "OK",
  "data": {
    "id": 142134328,
    "uid": "arozsmml2kx1xr8o",
    "conversation_uid": "z95xejkfzji3yxxn"
  }
}
```

## Authentication

Available for **Staff** tokens.

| Token Type | Works | Notes |
|------------|-------|-------|
| Staff | Yes | Requires staff associated with a business |
| App | No | Returns 400 - no staff/business context |
| Directory | No | Returns 401 |

## Known Issues

### Issue: 422 when business is spam-flagged or blocked

**Description**: The endpoint returns `{"status":"Error","data":{}}` with HTTP 422 if the business fails the `business_allowed_to_send?` check in `MessagingAPI`. This happens when either `business.spammer?` is true (and the account is not verified) or `user.access_blocked?` is true.

**Root Cause**: The controller renders any non-"OK" response from `MessagingAPI.send_message` as HTTP 422. The `business_allowed_to_send?` guard checks spam flags and account blocking status. Test accounts that are not verified and have been flagged (e.g., by automated test runs) will permanently fail this check.

**Fix**: Create a fresh business using the setup script (`node api-validation/scripts/setup-business.js`) to get a clean, unflagged business. Verified accounts bypass the spam check entirely.

## Critical Learnings

1. **Business must not be spam-flagged**: The `business_allowed_to_send?` check gates all message creation. Non-verified businesses with `settings.spammer = true` or users with `blocked_at` set will always get 422.
2. **Verified accounts bypass spam check**: `business.spammer?` returns false for verified accounts regardless of the spammer flag.
3. **Conversation auto-creation**: If no `conversation_uid` is provided, the endpoint finds or creates a conversation for the given `client_id` via `ConversationsAPI.get_matter_conversation`.
4. **Channels default**: If `channels` is not provided, defaults to `['sms', 'email']`.
