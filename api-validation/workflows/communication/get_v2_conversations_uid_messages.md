---
endpoint: "GET /v2/conversations/{conversation_id}/messages"
domain: communication
tags: [conversations, messages]
swagger: swagger/communication/legacy/legacy_v2_communication.json
status: verified
savedAt: 2026-02-14T00:00:00.000Z
verifiedAt: 2026-02-14T00:00:00.000Z
timesReused: 0
tokens: [staff, directory]
---

# Get Conversation Messages

## Summary

Retrieves a paginated list of messages within a specific conversation. Messages are returned in chronological order and include staff details, document attachments, and delivery status.

Available for **Staff and Directory tokens**. Directory tokens require the `X-On-Behalf-Of` header with the target business UID.

## Authentication

| Token Type | Works | Notes |
|------------|-------|-------|
| Staff | ✅ | Requires staff to be associated with a business |
| Directory | ✅ | Requires `X-On-Behalf-Of` header with business UID |
| App | ❌ | Returns 500 - `current_user` is nil, cannot resolve `organization` |
| Internal | ✅ | Full access (admin type) |

## Prerequisites

```yaml
steps:
  - id: get_conversation
    description: "Fetch a conversation to retrieve messages from"
    method: GET
    path: "/v2/conversations"
    useFallbackApi: true
    params:
      per_page: "1"
    extract:
      conversation_uid: "$.data[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    method: GET
    path: "/v2/conversations/{{conversation_uid}}/messages"
    useFallbackApi: true
    params:
      per_page: "20"
    expect:
      status: [200]
```
