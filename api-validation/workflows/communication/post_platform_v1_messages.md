---
endpoint: "POST /platform/v1/messages"
domain: communication
tags: []
swagger: swagger/communication/legacy/legacy_v1_communication.json
status: success
savedAt: 2026-01-27T06:26:22.574Z
verifiedAt: 2026-01-27T06:26:22.574Z
---

# Create Messages

## Summary
Test passes after providing valid conversation_uid and correcting field values. The API requires either a valid conversation_uid or an existing matter for the client.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_messages
    method: POST
    path: "/platform/v1/messages"
    body:
      message:
        channels: sms,email
        client_id: "{{client_id}}"
        conversation_title: Test Message API
        direction: business_to_client
        staff_id: "{{staff_id}}"
        text: This is a test message from API
        conversation_uid: "{{conversation_uid}}"
    expect:
      status: [200, 201]
```
