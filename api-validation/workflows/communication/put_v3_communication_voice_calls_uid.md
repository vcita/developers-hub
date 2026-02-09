---
endpoint: "PUT /v3/communication/voice_calls/{uid}"
domain: communication
tags: [voice_calls]
swagger: swagger/communication/communication.json
status: verified
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
---

# Update Voice Call

## Summary
Updates a specific voice call by its unique identifier. **Token Type**: Requires a **staff token**.

## Prerequisites
```yaml
steps:
  - id: get_voice_calls
    description: "Fetch available voice calls"
    method: GET
    path: "/v3/communication/voice_calls"
    params:
      per_page: "1"
    extract:
      voice_call_uid: "$.data.voice_calls[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: main_request
    method: PUT
    path: "/v3/communication/voice_calls/{{voice_call_uid}}"
    body:
      status: "ANSWERED_BY_STAFF"
    expect:
      status: 200
```