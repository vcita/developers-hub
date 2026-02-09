---
endpoint: "GET /v3/communication/reports/voice_call_stats"
domain: communication
tags: [voice_calls, reports, statistics]
swagger: swagger/communication/communication.json
status: verified
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
---

# Get Voice Call Statistics

## Summary
Returns aggregated voice call status counts for the requested period and status filter. **Token Type**: Requires a **staff token**.

## Test Request
```yaml
steps:
  - id: main_request
    method: GET
    path: "/v3/communication/reports/voice_call_stats"
    expect:
      status: 200
```