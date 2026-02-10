---
endpoint: "PUT /v3/access_control/staff_permission_overrides_lists/{staff_uid}"
domain: platform_administration
tags: [access_control, permissions]
swagger: "swagger/platform_administration/access_control.json"
status: pending
expectedOutcome: 403
expectedOutcomeReason: "The staff role configuration feature is disabled in this environment"
savedAt: "2026-01-29T21:00:00.000Z"
verifiedAt: "2026-01-29T21:00:00.000Z"
timesReused: 0
---

# Update Staff permission overrides lists

## Summary
Update permission overrides for a staff member. **Token Type**: Requires a **staff token**.

> ⚠️ Expected Outcome: 403 - The staff role configuration feature is disabled in this environment

## Test Request

```yaml
steps:
  - id: put_staff_permission_overrides_lists
    method: PUT
    path: "/v3/access_control/staff_permission_overrides_lists/{{staff_id}}"
    token: staff
    body:
      permissions:
        - key: "payments.invoices.export"
          state: "allow"
        - key: "payments.invoices.view"
          state: "deny"
    expect:
      status: 403
```