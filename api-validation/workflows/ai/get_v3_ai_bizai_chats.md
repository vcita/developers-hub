---
endpoint: "GET /v3/ai/bizai_chats"
domain: ai
tags: [bizai_chats, ai]
swagger: swagger/ai/bizai.json
status: verified
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
tokens: [staff]
---

# List BizAI Chats

## Summary
Retrieves a list of all BizAI chat sessions for the business. **Token Type**: Requires a **staff token**.

## Test Request
```yaml
steps:
  - id: list_bizai_chats
    method: GET
    path: "/v3/ai/bizai_chats"
    params:
      per_page: "10"
    expect:
      status: 200
```