---
endpoint: GET /v3/communication/voice_calls/reports/voice_call_stats
domain: communication
tags: [communication, voice_calls, reports, stats]
status: verified
savedAt: 2026-01-22T23:56:07.306Z
verifiedAt: 2026-01-22T23:56:07.306Z
timesReused: 0
---
# Get Voice call stats

## Summary
Get voice call statistics with optional filtering by date range and status

## Prerequisites
No specific prerequisites needed - uses staff token authentication

## How to Resolve Parameters
1. Use the correct endpoint path: /v3/communication/reports/voice_call_stats (NOT /v3/communication/voice_calls/reports/voice_call_stats)
2. Optional query parameters: start_date, end_date, status
3. Returns status_counts array with count per status and total_voice_calls

## Critical Learnings

- **Incorrect API path in documentation** - The documented path /v3/communication/voice_calls/reports/voice_call_stats is wrong. The correct path is /v3/communication/reports/voice_call_stats
- **Optional query parameters work correctly** - The endpoint accepts start_date, end_date, and status parameters for filtering results

## Verified Successful Request

```json
{
  "method": "GET",
  "path": "/v3/communication/reports/voice_call_stats?start_date=2024-01-01&end_date=2024-01-31&status=INCOMING_CALL"
}
```

## Documentation Fix Suggestions

No documentation issues found.