---
endpoint: "POST /business/messaging/v1/channels/typing"
domain: communication
tags: []
swagger: "swagger/communication/legacy/messages.json"
status: verified
savedAt: "2026-01-27T06:19:17.837Z"
verifiedAt: "2026-01-27T06:19:17.837Z"
timesReused: 0
---

# Create Typing

## Summary
Test passes after providing a valid client UID from GET /platform/v1/clients. The endpoint requires either 'uid' or 'contact_uid' in the contact object, and when source='business', it uses the external typing status flow.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_typing
    method: POST
    path: "/business/messaging/v1/channels/typing"
    body:
      contact:
        uid: "{{uid}}"
        channel_uid: test_channel_123
        external_uid: ext_123
        source: business
        typing: true
    expect:
      status: [200, 201]
```
