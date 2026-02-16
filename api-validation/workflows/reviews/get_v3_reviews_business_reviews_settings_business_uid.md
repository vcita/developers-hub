---
endpoint: "GET /v3/reviews/business_reviews_settings/{business_uid}"
domain: reviews
tags: [reviews, business_settings]
swagger: swagger/reviews/business_reviews_settings.json
status: verified
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
useFallbackApi: true
tokens: [staff]
---

# Get Business Reviews Settings

## Summary
Retrieves the reviews settings for a specific business. **Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required

## Prerequisites
None required - uses built-in business_id variable.

## Test Request
```yaml
steps:
  - id: main_request
    method: GET
    path: "/v3/reviews/business_reviews_settings/{{business_id}}"
    expect:
      status: 200
```