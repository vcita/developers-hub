---
endpoint: "GET /v3/communication/voice_calls"
domain: communication
tags: [voice_calls]
swagger: swagger/communication/communication.json
status: verified
savedAt: 2026-02-09T07:28:12.398Z
verifiedAt: 2026-02-09T07:28:12.398Z
timesReused: 0
---

# List Voice Calls

## Summary
Retrieves a list of voice calls. **Token Type**: Requires a **staff token**.

## Prerequisites
```yaml
steps: []
```

## Test Request
```yaml
steps:
  - id: main_request
    method: GET
    path: "/v3/communication/voice_calls"
    params:
      per_page: "5"
    expect:
      status: 200
```