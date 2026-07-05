---
endpoint: "GET /v3/communication/voice_call_quotas"
domain: communication
tags: [voice_calls, quotas]
swagger: swagger/communication/communication.json
status: verified
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
---

# Get Voice Call Quotas

## Summary
Retrieves voice call quota information including credit limits and balances for the business. **Token Type**: Requires a **staff token**.

## Test Request
```yaml
steps:
  - id: main_request
    method: GET
    path: "/v3/communication/voice_call_quotas"
    expect:
      status: 200
```