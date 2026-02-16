---
endpoint: "PUT /v3/business_administration/staff_quick_action_lists/{staff_uid}"
domain: platform_administration
tags: [staff-only]
swagger: "swagger/platform_administration/staff.json"
status: verified
useFallbackApi: true
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
---

# Update Staff Quick Action Lists

## Summary
This endpoint allows updating the quick action lists for a specific staff member. **Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required

## Prerequisites

```yaml
steps:
  - id: get_staff_quick_actions
    description: "Get staff quick action lists to extract a staff UID"
    method: GET
    path: "/v3/business_administration/staff_quick_action_lists"
    extract:
      staff_uid: "$.data.staff_quick_action_lists[0].staff_uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: update_staff_quick_actions
    method: PUT
    path: "/v3/business_administration/staff_quick_action_lists/{{staff_uid}}"
    body:
      quick_actions:
        - name: "point_of_sale"
          order: 0
          visible: true
        - name: "appointment"
          order: 1
          visible: true
        - name: "client"
          order: 2
          visible: false
    expect:
      status: 200
```