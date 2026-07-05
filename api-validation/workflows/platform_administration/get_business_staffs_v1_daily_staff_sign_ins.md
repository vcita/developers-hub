---
endpoint: "GET /business/staffs/v1/daily_staff_sign_ins"
domain: platform_administration
tags: [staffs, sign-ins]
swagger: swagger/platform_administration/legacy/staff.json
status: verified
savedAt: 2026-03-01T00:00:00.000Z
verifiedAt: 2026-03-01T00:00:00.000Z
timesReused: 0
---

# Get Daily Staff Sign Ins

## Summary
Retrieves daily staff sign-in data for a business within a specified date range. **Token Type**: Requires a **staff token**.

The parameters must be sent as nested filter query parameters: `filter[start_date][eq]` and `filter[end_date][eq]`.
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
      filter[start_date][eq]: "{{current_date}}"
      filter[end_date][eq]: "{{current_date}}"
    expect:
      status: 200
```
