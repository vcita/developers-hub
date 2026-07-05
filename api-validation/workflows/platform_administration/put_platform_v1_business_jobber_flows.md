---
endpoint: "PUT /platform/v1/business/jobber/flows"
domain: platform_administration
tags: [jobber, flows]
swagger: "swagger/platform_administration/legacy/legacy_v1_platform.json"
status: pending
savedAt: 2026-02-09T23:25:00.000Z
verifiedAt: 2026-02-09T23:25:00.000Z
timesReused: 0
useFallbackApi: true
---

# Update Jobber Flow

## Summary
Updates a Jobber flow for scheduled payments. **Token Type**: Requires a **staff token**. 

> ⚠️ Fallback API Required

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: update_jobber_flow
    method: PUT
    path: "/platform/v1/business/jobber/flows"
    body:
      uid: "test-flow-{{now_timestamp}}"
      entity_uid: "{{business_id}}"
      entity_type: "business"
      flow_type: "create_payment"
      time_zone_name: "UTC"
      active: false
      rules: []
    expect:
      status: [200, 201]
```