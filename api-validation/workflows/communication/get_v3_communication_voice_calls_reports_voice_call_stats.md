---
endpoint: "GET /v3/communication/voice_calls/reports/voice_call_stats"
domain: communication
tags: [voice_calls, reports, statistics]
swagger: swagger/communication/communication.json
status: verified
savedAt: 2026-01-27T00:28:12.398Z
verifiedAt: 2026-01-27T00:28:12.398Z
timesReused: 0
---

# Get Voice Call Statistics (Corrected Path)

## Summary
Returns aggregated voice call status counts for the requested period and status filter. **Token Type**: Requires a **staff token**.

> ⚠️ **Path Correction**: The correct API path is `/v3/communication/reports/voice_call_stats`, not `/v3/communication/voice_calls/reports/voice_call_stats`.

## Test Request
```yaml
steps:
  - id: main_request
    method: GET
    path: "/v3/communication/reports/voice_call_stats"
    expect:
      status: 200
```