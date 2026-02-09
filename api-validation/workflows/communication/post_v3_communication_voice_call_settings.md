---
endpoint: "POST /v3/communication/voice_call_settings"
domain: communication
tags: [voice_call_settings]
swagger: swagger/communication/communication.json
status: verified
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
tokens: [staff]
---

# Create Voice Call Settings

## Summary
Creates voice call settings for the business. **Token Type**: Requires a **staff token**. Only one voice call setting can exist per business - subsequent calls return 409 Conflict.

## Test Request
```yaml
steps:
  - id: create_voice_call_settings
    method: POST
    path: "/v3/communication/voice_call_settings"
    body: {}
    expect:
      status: [201, 409]
```