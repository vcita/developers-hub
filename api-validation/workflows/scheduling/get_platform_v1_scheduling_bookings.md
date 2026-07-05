---
endpoint: "GET /platform/v1/scheduling/bookings"
domain: scheduling
tags: [scheduling, bookings, client]
swagger: "swagger/scheduling/legacy/legacy_v1_scheduling.json"
status: verified
savedAt: "2026-02-01T23:30:00.000Z"
verifiedAt: "2026-02-01T23:30:00.000Z"
timesReused: 0
---

# Get Client Bookings

## Summary
Returns a paginated list of the client's appointments and event registrations.

## Prerequisites

None required for this endpoint.


## Authentication
Available for **Client tokens** only. Staff tokens will receive 401 Unauthorized.

## Test Request

```yaml
steps:
  - id: get_client_bookings
    method: GET
    path: "/platform/v1/scheduling/bookings"
    token: client
    params:
      per_page: "25"
      offset: "0"
      business_id: "{{business_id}}"
    expect:
      status: [200]
```

## Query Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `per_page` | Yes | string | Maximum number of records returned (pagination) |
| `offset` | Yes | string | First record's index (e.g., per_page=10, offset=1 returns records 11-20) |
| `business_id` | Yes | string | Business UID |
| `matter_uid` | No | string | Filter by matter UID |
| `passed` | No | string | If 'true', returns only past bookings |
| `start_time` | No | string | Filter recurring items with start_time greater than this |
| `end_time` | No | string | Filter recurring items with start_time less than this |

## Expected Response (200)

```json
{
  "status": "OK",
  "data": {
    "bookings": [
      {
        "uid": "wpyygjkyu0jca08e",
        "type": "appointment",
        "title": "Appointment 1",
        "client_id": "3zashrlha0cwvnoz",
        "duration": 60,
        "start_time": "2025-08-07T01:56:21.751-05:00",
        "end_time": "2025-08-07T02:56:21.751-05:00"
      }
    ]
  }
}
```

## Error Responses

### 401 - Unauthorized (non-Client token)
```json
{
  "error": "Unauthorized"
}
```

Occurs when using Staff, App, or Directory tokens instead of a Client token.

### 500 - Internal Server Error
```json
{
  "error": "Internal Server Error"
}
```

Can occur if the client token references a non-existent client in the business.

## Notes

- **Client token required**: This endpoint only works with Client tokens
- **Business context**: The client must exist in the specified business
- All pagination parameters are strings, not integers
