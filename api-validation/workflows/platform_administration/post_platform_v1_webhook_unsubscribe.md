---
endpoint: "POST /platform/v1/webhook/unsubscribe"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/legacy/legacy_v1_platform.json"
status: verified
savedAt: "2026-01-29T08:59:05.939Z"
verifiedAt: "2026-01-29T08:59:05.939Z"
timesReused: 0
---

# Create Unsubscribe

## Summary
Webhook unsubscribe endpoint works successfully. Returns HTTP 200 with 'Unsubscribed' response, indicating successful webhook unsubscription. Found documentation discrepancy regarding expected response code.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_unsubscribe
    method: POST
    path: "/platform/v1/webhook/unsubscribe"
    body:
      event: client.created
      target_url: https://api.example.com/webhooks/lawfirm-notifications
    expect:
      status: [200, 201]
```
