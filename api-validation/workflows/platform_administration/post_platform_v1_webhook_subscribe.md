---
endpoint: "POST /platform/v1/webhook/subscribe"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/legacy/legacy_v1_platform.json"
status: verified
savedAt: "2026-01-29T12:47:00.000Z"
verifiedAt: "2026-01-29T12:47:00.000Z"
timesReused: 0
---

# Create Subscribe

## Summary
Webhook subscription endpoint. **Token Type**: Requires a **staff token**. The endpoint returns 422 "Webhook already exists" if the same event/target_url combination is already subscribed, so we use a unique URL with random suffix.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_subscribe
    method: POST
    path: "/platform/v1/webhook/subscribe"
    body:
      event: client/created
      target_url: "https://example.com/webhook/test-{{staff_uid}}"
    expect:
      status: [200, 201]
```