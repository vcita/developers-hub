---
endpoint: "GET /v3/scheduling/business_availabilities"
domain: scheduling
tags: [scheduling, availability, directory]
swagger: "swagger/scheduling/availability.json"
status: verified
savedAt: "2026-02-01T23:30:00.000Z"
verifiedAt: "2026-02-01T23:30:00.000Z"
timesReused: 0
---

# Get Business Availabilities

## Summary
Returns available booking slots for all businesses in your directory with pagination support.

## Prerequisites

None required for this endpoint.


## Authentication
Available for **Directory tokens** only. Staff tokens will receive a 403 Forbidden error.

## Test Request

```yaml
steps:
  - id: get_availabilities
    method: GET
    path: "/v3/scheduling/business_availabilities"
    token: directory
    params:
      date_start: "{{today_date}}"
      date_end: "{{date_plus_7_days}}"
      page: 0
      per_page: 10
    expect:
      status: [200]
```

## Query Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `date_start` | Yes | string | Start date in YYYY-MM-DD format |
| `date_end` | Yes | string | End date in YYYY-MM-DD format. Maximum 7 days from date_start. |
| `page` | No | integer | Page number (0-based). Default: 0 |
| `per_page` | No | integer | Items per page. Maximum 10. Default: 10 |
| `scheduling_enabled` | No | boolean | Filter by scheduling status. Default: true |

## Expected Response (200)

```json
{
  "success": true,
  "data": {
    "business_availabilities": [
      {
        "business_uid": "d290f1ee26c54",
        "date": "2026-02-01",
        "slots": [
          {
            "start_time": "09:00",
            "end_time": "09:30",
            "staff_uid": "staff123"
          }
        ]
      }
    ]
  }
}
```

## Error Responses

### 400 - Invalid Parameters
```json
{
  "error": "date_start is required"
}
```

### 403 - Forbidden (non-Directory token)
```json
{
  "error": "Unauthorized: Only directory actors can access this endpoint"
}
```

### 429 - Too Many Requests
```json
{
  "error": "Another request is currently processing for this directory. Please retry after a few seconds."
}
```

## Notes

- **Directory token required**: This endpoint only works with Directory tokens. Staff, App, and Client tokens will receive 403.
- **Date range limit**: Maximum 7 days between date_start and date_end.
- **Pagination limit**: Maximum per_page value is 10.
- **Concurrent request lock**: Only one request per directory can be processed at a time. Concurrent requests receive 429.
