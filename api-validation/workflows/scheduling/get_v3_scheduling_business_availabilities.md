---
endpoint: GET /v3/scheduling/business_availabilities
domain: scheduling
tags: [scheduling, availability, business, directory]
status: verified
savedAt: 2026-01-22T21:47:36.451Z
verifiedAt: 2026-01-22T21:47:36.451Z
timesReused: 0
---
# Get Business availabilities

## Summary
Get all BusinessAvailabilities for a date range with directory token

## Prerequisites
Directory-level access token is required

## How to Resolve Parameters
1. Use directory token (not staff token) 2. Add required query parameters: date_start and date_end as ISO 8601 date strings 3. Ensure date range does not exceed 7 days 4. Example: GET /v3/scheduling/business_availabilities?date_start=2024-01-01T00:00:00Z&date_end=2024-01-07T23:59:59Z

## Critical Learnings

- **Directory token required** - Only directory actors can access this endpoint, staff token returns 403
- **Date range validation** - Date range cannot exceed 7 days maximum
- **Query parameters required** - date_start and date_end are required as ISO 8601 date strings in query parameters, not request body

## Verified Successful Request

```json
{
  "method": "GET",
  "path": "/v3/scheduling/business_availabilities?date_start=2024-01-01T00:00:00Z&date_end=2024-01-07T23:59:59Z"
}
```

## Documentation Fix Suggestions

No documentation issues found.