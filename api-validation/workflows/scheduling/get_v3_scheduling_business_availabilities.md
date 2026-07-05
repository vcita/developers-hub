---
endpoint: "GET /v3/scheduling/business_availabilities"
domain: scheduling
tags: [scheduling, availability, directory]
swagger: "swagger/scheduling/availability.json"
status: verified
savedAt: "2026-02-02T10:30:00.000Z"
verifiedAt: "2026-02-02T10:30:00.000Z"
timesReused: 0
tokens: [directory]
---

# Get Business Availabilities

## Summary
Returns available booking slots for all businesses in your directory with pagination support. **Token Type**: Requires a **Directory token** with X-On-Behalf-Of header.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_availabilities
    method: GET
    path: "/v3/scheduling/business_availabilities"
    token: directory
    params:
      date_start: "2026-02-03"
      date_end: "2026-02-09"
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
    "items": [
      {
        "business_uid": "d290f1ee26c54",
        "booking_slots": [
          "2026-02-09T15:00:00.000Z",
          "2026-02-09T15:30:00.000Z"
        ]
      }
    ],
    "total": "404"
  }
}
```

## Error Responses

### 400 - Invalid Parameters
```json
{
  "success": false,
  "errors": [
    {
      "message": [
        "date_start must be a valid ISO 8601 date string",
        "Date range cannot exceed 7 days",
        "date_end must be a valid ISO 8601 date string"
      ],
      "code": "bad_request"
    }
  ]
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

- **Directory token required**: This endpoint only works with Directory tokens with X-On-Behalf-Of header.
- **Date format**: Both date_start and date_end must be in YYYY-MM-DD format (not full ISO 8601 datetime).
- **Date range limit**: Maximum 7 days between date_start and date_end.
- **Pagination limit**: Maximum per_page value is 10.
- **Concurrent request lock**: Only one request per directory can be processed at a time. Concurrent requests receive 429.