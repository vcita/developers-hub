---
endpoint: "POST /v3/reviews/business_reviews_settings"
domain: reviews
tags: [reviews, business_settings]
swagger: swagger/reviews/business_reviews_settings.json
status: verified
savedAt: 2026-01-27T09:30:00.000Z
verifiedAt: 2026-01-27T09:30:00.000Z
timesReused: 0
useFallbackApi: true
tokens: [staff]
---

# Create Business Reviews Settings

## Summary
Creates new business reviews settings. **Token Type**: Requires a **staff token**. Returns 201 on successful creation or 409 if settings already exist for the business.

> ⚠️ Fallback API Required

## Prerequisites
None required - uses built-in business_id variable.

## Test Request
```yaml
steps:
  - id: main_request
    method: POST
    path: "/v3/reviews/business_reviews_settings"
    body:
      business_uid: "{{business_id}}"
      display_review_sharing_consent: true
      platform_id: 1
      platform_params:
        place_id: 12345
    expect:
      status: [201, 409]
```