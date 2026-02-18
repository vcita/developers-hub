---
endpoint: "POST /v3/reviews/business_reviews_settings"
domain: reviews
tags: [reviews, business_settings]
swagger: swagger/reviews/business_reviews_settings.json
status: verified
savedAt: 2026-01-27T09:30:00.000Z
verifiedAt: 2026-01-27T09:30:00.000Z
timesReused: 0
tokens: [staff]
---

# Create Business Reviews Settings

## Summary
Creates new business reviews settings. **Token Type**: Requires a **staff token**. Returns 201 on successful creation or 409 if settings already exist for the business.

## Prerequisites
```yaml
steps:
  - id: get_business_info
    description: "Get business context from clients endpoint"
    method: GET
    path: "/platform/v1/clients"
    params:
      per_page: "1"
    extract:
      business_uid: "$.data.clients[0].business_uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: main_request
    method: POST
    path: "/v3/reviews/business_reviews_settings"
    body:
      business_uid: "{{business_uid}}"
      display_review_sharing_consent: true
      platform_id: 1
      platform_params:
        place_id: 12345
    expect:
      status: [201, 409]
```