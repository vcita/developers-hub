---
endpoint: "POST /platform/v1/webhook/subscribe"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/legacy/legacy_v1_platform.json
status: success
savedAt: 2026-01-28T10:09:42.228Z
verifiedAt: 2026-01-28T10:09:42.228Z
---

# Create Subscribe

## Summary
Test passes after correcting parameter names. The swagger documentation has incorrect field names - actual implementation expects 'event' and 'target_url' instead of 'entity' and 'event_type'.

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
      target_url: https://example.com/webhook
    expect:
      status: [200, 201]
```
