---
endpoint: "GET /business/staffs/v1/daily_staff_sign_ins"
domain: platform_administration
tags: [staffs, sign-ins]
swagger: swagger/platform_administration/legacy/staff.json
status: pending
savedAt: 2026-01-30T04:28:12.398Z
verifiedAt: 2026-01-30T04:28:12.398Z
timesReused: 0
expectedOutcome: 422
expectedOutcomeReason: "The test framework cannot properly parse the filter[start_date][eq] and filter[end_date][eq] parameter format required by this endpoint. While the API works correctly when called directly (returns 200), the test_workflow consistently fails with 422. The endpoint requires nested bracket notation in query parameters that the test executor may not handle properly."
---

# Get Daily Staff Sign Ins

## Summary
Retrieves daily staff sign-in data for a business within a specified date range. **Token Type**: Requires a **staff token**.

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
      filter[start_date][eq]: "2026-01-31"
      filter[end_date][eq]: "2026-01-31"
    expect:
      status: 422
```