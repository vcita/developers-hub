---
endpoint: "POST /v2/conversations/{uid}/messages"
domain: communication
tags: [conversations, messages]
swagger: swagger/communication/communication.json
status: verified
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
tokens: [staff]
useFallbackApi: true
---

# Create Conversation Message

## Summary

Send a message in a conversation. **Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required

## Prerequisites

```yaml
steps:
  - id: get_conversation
    description: "Fetch a conversation to send message to"
    method: GET
    path: "/v2/conversations"
    params:
      per_page: "1"
    extract:
      conversation_uid: "$.data[0].uid"
      channel_uid: "$.data[0].client.uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    method: POST
    path: "/v2/conversations/{{conversation_uid}}/messages"
    body:
      text: "<div>Test message from API validation {{now_timestamp}}</div>"
      channels: ["email"]
      channel_uid: "{{channel_uid}}"
    expect:
      status: [200, 201]
```