---
endpoint: "GET /v3/communication/voice_call_settings"
domain: communication
tags: [voice_call_settings, communication]
swagger: swagger/communication/communication.json
status: verified
savedAt: 2026-01-28T10:30:00.000Z
verifiedAt: 2026-01-28T10:30:00.000Z
timesReused: 0
tokens: [staff]
---

# Get Voice Call Settings

## Summary
Retrieves voice call settings for the business including forwarding configuration, timeout settings, and external app status. **Token Type**: Requires a **staff token**.

## Test Request
```yaml
steps:
  - id: main_request
    method: GET
    path: "/v3/communication/voice_call_settings"
    expect:
      status: 200
```