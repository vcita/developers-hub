---
endpoint: "GET /v3/ai/ai_recommendations"
domain: ai
tags: [ai_recommendations, ai]
swagger: swagger/ai/recommendations.json
status: verified
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
tokens: [staff]
---

# List AI Recommendations

## Summary
Retrieve a list of AI recommendations with optional filtering by status, target, and context. **Token Type**: Requires a **staff token**.

## Test Request
```yaml
steps:
  - id: list_ai_recommendations
    method: GET
    path: "/v3/ai/ai_recommendations"
    params:
      status: "active"
    expect:
      status: 200
```