---
endpoint: "GET /platform/v1/messages"
domain: communication
tags: [messages, messaging]
swagger: "swagger/communication/legacy/legacy_v1_communication.json"
status: skipped
savedAt: "2026-01-27T19:30:00.000Z"
expectedOutcome: 404
expectedOutcomeReason: "Backend implementation missing: Platform::V1::MessagesController only has create method, no index method implemented despite being documented in swagger and routes.rb"
---

# Get Messages

## Summary

Retrieves messages from the messaging system for a specific conversation. **This endpoint consistently returns 404 due to missing backend implementation.**

**Token Type**: Expected to work with **Staff token** based on similar communication endpoints.

> ⚠️ **Backend Implementation Missing**
> While the swagger documents this endpoint and routes.rb includes it in the messages resource, the actual Platform::V1::MessagesController only implements the create method. The index method is missing from the controller implementation.

## Prerequisites

```yaml
steps:
  - id: get_conversation
    description: "Fetch conversations to get a valid conversation ID"
    method: GET
    path: "/platform/v1/conversations"
    useFallbackApi: true
    expect:
      status: [200]
    onFail: abort
    extract:
      conversation_id: "$.data.conversations[0].id"
```

## Test Request

```yaml
steps:
  - id: get_messages
    description: "Attempt to get messages for conversation"
    method: GET
    path: "/platform/v1/messages"
    useFallbackApi: true
    params:
      conversation_id: "{{conversation_id}}"
    expect:
      status: [404]
```