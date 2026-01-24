---
endpoint: GET /platform/v1/services/availability
domain: sales
tags: []
status: verified
savedAt: 2026-01-23T08:42:45.237Z
verifiedAt: 2026-01-23T08:42:45.237Z
timesReused: 0
---
# Get Availability

## Summary
Fixed GET /platform/v1/services/availability by adding required parameters service_ids, start_date, and end_date. The endpoint requires service IDs which were obtained from /platform/v1/services endpoint.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "GET",
  "path": "/platform/v1/services/availability?service_ids=nd7zqtlqlq0wda4s&start_date=2024-01-15&end_date=2024-01-22"
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| service_ids | Missing required parameter service_ids or id in the endpoint documentation or test setup | Add service_ids parameter to the request. Can be obtained from GET /platform/v1/services endpoint. | critical |
| start_date | Missing required parameter start_date | Add start_date parameter in YYYY-MM-DD format | critical |
| end_date | Missing required parameter end_date | Add end_date parameter in YYYY-MM-DD format | critical |