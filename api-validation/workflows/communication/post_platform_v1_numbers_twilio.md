---
endpoint: "POST /platform/v1/numbers/twilio"
domain: communication
tags: []
swagger: swagger/communication/legacy/legacy_v1_communication.json
status: success
savedAt: 2026-01-27T06:29:35.320Z
verifiedAt: 2026-01-27T06:29:35.320Z
---

# Create Twilio

## Summary
Test passes after creating fresh business and using directory token. Endpoint successfully creates Twilio integration with HTTP 201.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_twilio
    method: POST
    path: "/platform/v1/numbers/twilio"
    body:
      business_uid: "{{business_uid}}"
      messaging_id: MSG1703123456
      number: "+15551234567"
      sub_account_id: "{{sub_account_id}}"
    expect:
      status: [200, 201]
```
