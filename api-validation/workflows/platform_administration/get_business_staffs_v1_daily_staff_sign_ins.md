---
endpoint: "GET /business/staffs/v1/daily_staff_sign_ins"
domain: platform_administration
tags: [staffs, sign-ins]
swagger: swagger/platform_administration/staff.json
status: verified
savedAt: 2026-01-30T04:28:12.398Z
verifiedAt: 2026-01-30T04:28:12.398Z
timesReused: 0
useFallbackApi: true
---

# Get Daily Staff Sign Ins

## Summary
Retrieves daily staff sign-in data for a business within a specified date range. **Token Type**: Requires a **staff token**.

> ⚠️ **Fallback API Required**: This endpoint requires the fallback API due to main gateway routing issues.

The parameters must be sent in filter format with nested [eq] structure: `filter[start_date][eq]` and `filter[end_date][eq]`.
Date format must be YYYY-MM-DD and the date range cannot exceed 31 days.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_daily_staff_sign_ins
    method: GET
    path: "/business/staffs/v1/daily_staff_sign_ins"
    params:
      filter[start_date][eq]: "2024-01-01"
      filter[end_date][eq]: "2024-01-01"
    expect:
      status: 200
```