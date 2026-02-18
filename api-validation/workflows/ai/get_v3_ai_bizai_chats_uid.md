---
endpoint: "GET /v3/ai/bizai_chats/{uid}"
domain: ai
tags: [bizai_chats, ai]
swagger: swagger/ai/bizai.json
status: verified
savedAt: 2026-02-18T12:27:28.398Z
verifiedAt: 2026-02-18T12:27:28.398Z
timesReused: 0
tokens: [staff]
---

# Get BizAI Chat

## Summary
Retrieves a specific BizAI chat session by its unique identifier. **Token Type**: Requires a **staff token**.

## Prerequisites
```yaml
steps:
  - id: create_bizai_chat
    description: "Create a BizAI chat session"
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
    path: "/v3/ai/bizai_chats/{{chat_uid}}"
    expect:
      status: 200
```