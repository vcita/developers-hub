---
endpoint: "GET /v3/business_administration/staff_quick_action_lists"
domain: platform_administration
tags: [staff-only]
swagger: "swagger/platform_administration/staff.json"
status: verified
useFallbackApi: true
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
---

# Get Staff Quick Action Lists

## Summary
This endpoint retrieves the quick action lists for all staff members in the business. **Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required

## Prerequisites

```yaml
steps: []
```

## Test Request

```yaml
steps:
  - id: get_staff_quick_actions
    method: GET
    path: "/v3/business_administration/staff_quick_action_lists"
    expect:
      status: 200
```