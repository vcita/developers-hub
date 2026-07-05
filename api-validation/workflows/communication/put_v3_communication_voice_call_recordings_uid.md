---
endpoint: "PUT /v3/communication/voice_call_recordings/{uid}"
domain: communication
tags: [voice_call_recordings]
swagger: swagger/communication/communication.json
status: pending
savedAt: 2026-01-27T07:33:15.000Z
expectedOutcome: 404
expectedOutcomeReason: "Voice call recordings are only created when actual call recordings exist. Test environment voice calls do not have recordings attached."
---

# Update Voice Call Recording

## Summary
Updates a voice call recording's played status. **Token Type**: Requires a **staff token**.

> ⚠️ **Note**: This endpoint only works with voice calls that have actual recordings attached. Most test environment voice calls do not have recordings.

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
    path: "/v3/communication/voice_call_recordings/{{voice_call_uid}}"
    body:
      record_played: true
    expect:
      status: [200, 404]
```