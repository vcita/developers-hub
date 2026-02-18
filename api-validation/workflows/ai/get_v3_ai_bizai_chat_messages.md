---
endpoint: "GET /v3/ai/bizai_chat_messages"
domain: ai
tags: [bizai_chat_messages, ai]
swagger: swagger/ai/bizai.json
status: verified
savedAt: 2026-02-18T12:28:12.398Z
verifiedAt: 2026-02-18T12:28:12.398Z
timesReused: 0
tokens: [staff]
---

# Get BizAI Chat Messages

## Summary
Retrieves all BizAI chat messages exchanged within a specific chat. **Token Type**: Requires a **staff token**.

## Prerequisites
```yaml
steps:
  - id: create_bizai_chat
    description: "Create a BizAI chat session to get messages from"
    method: POST
    path: "/v3/ai/bizai_chats"
    body:
      agent: "vanilla"
      config:
        instruction: "You are a helpful assistant."
        model_name: "gpt-3.5-turbo"
    extract:
      chat_uid: "$.data.uid"
    expect:
      status: 201
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: main_request
    method: GET
    path: "/v3/ai/bizai_chat_messages"
    params:
      ai_chat_uid: "{{chat_uid}}"
      per_page: "10"
    expect:
      status: 200
```