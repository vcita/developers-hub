---
endpoint: POST /business/scheduling/v1/bookings
domain: scheduling
tags: []
status: pass
savedAt: 2026-01-23T22:18:19.055Z
verifiedAt: 2026-01-23T22:18:19.055Z
timesReused: 0
---
# Create Bookings

## Summary
The endpoint works correctly when valid UIDs are provided, but I discovered a code bug and documentation issues.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| service_id | GET /platform/v1/services?business_id=pihawe0kf7fu7xo1 | - | No |

```json
{
  "service_id": {
    "source_endpoint": "GET /platform/v1/services?business_id=pihawe0kf7fu7xo1",
    "resolved_value": "nd7zqtlqlq0wda4s",
    "used_fallback": false,
    "fallback_endpoint": null
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/business/scheduling/v1/bookings",
  "body": {
    "business_id": "pihawe0kf7fu7xo1",
    "client_id": "2l2ut3opxv7heqcq",
    "staff_id": "guwtwt70kxgic65r",
    "service_id": "raj8aqjta9gz99vi",
    "start_time": "2026-01-24T11:00:00.000Z",
    "time_zone": "UTC",
    "matter_uid": "b265c1w0zqokgkz8",
    "arrival_window_value": 30,
    "interaction_details": "123 Main Street, City, State 12345",
    "campaign": "online_booking",
    "channel": "website",
    "source_name": "Company Website",
    "source_url": "https://example.com/booking"
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| service_id | The API accepts invalid service IDs and produces a confusing 500 error instead of a proper validation error. When an invalid service_id is provided, the code fails with 'undefined method id for #<Hash>' instead of a clear 'Service not found' message. | The code should extract the first element from the service_uid array before passing it to get_service(), or provide better validation upfront to reject invalid service IDs with a clear error message. | major |
| service_id | Documentation should clarify that service_id must be a valid service UID that exists for the specified business. The swagger should include information about how to get valid service IDs from GET /platform/v1/services. | Add documentation showing the relationship between business_id and service_id, and reference the services endpoint for getting valid IDs. | minor |
| event_instance_id | The documentation mentions event_instance_id as optional but doesn't explain when it should be used vs service_id, or how to get valid event_instance_id values. | Clarify that event_instance_id is for booking events (service_type='event') while service_id is for appointments (service_type='appointment'), and add reference to relevant endpoints for getting these IDs. | minor |