---
endpoint: "GET /v3/ai/ai_smart_replies"
domain: ai
tags: [ai_smart_replies, ai]
swagger: swagger/ai/ai_smart_reply.json
status: verified
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
tokens: [staff]
---

# List AI Smart Replies

## Summary
Retrieve a list of smart replies with optional filtering. **Token Type**: Requires a **staff token**.

## Test Request
```yaml
steps:
  - id: list_ai_smart_replies
    method: GET
    path: "/v3/ai/ai_smart_replies"
    params:
      per_page: "20"
    expect:
      status: 200
```