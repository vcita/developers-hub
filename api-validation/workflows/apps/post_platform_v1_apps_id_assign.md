---
endpoint: "POST /platform/v1/apps/{id}/assign"
domain: apps
tags: []
swagger: "swagger/apps/legacy/legacy_v1_apps.json"
status: verified
savedAt: "2026-01-25T06:04:53.337Z"
verifiedAt: "2026-01-25T06:04:53.337Z"
timesReused: 0
---

# Create Assign

## Summary
Successfully tested both directory and business app assignments. The endpoint works correctly when provided with proper parameters: directory_uid with is_internal for directory assignments, or business_uid with hide_from_market for business assignments.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_assign
    method: POST
    path: "/platform/v1/apps/{{id}}/assign"
    body:
      business_uid: "{{business_uid}}"
      hide_from_market: "true"
    expect:
      status: [200, 201]
```
