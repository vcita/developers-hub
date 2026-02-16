---
endpoint: "GET /platform/v1/business/jobber/flows"
domain: platform_administration
tags: [automation, flows]
swagger: swagger/platform_administration/legacy/legacy_v1_platform.json
status: verified
savedAt: 2026-02-09T23:21:08.000Z
verifiedAt: 2026-02-09T23:21:08.000Z
timesReused: 0
---

# Get Automation Flows

## Summary
Retrieves automation flows for a business based on the specified filters. This endpoint allows you to query existing automation flows by entity, module, and other criteria. **Token Type**: Requires a **staff token**.

> **Note**: This endpoint has been fixed by updating the swagger API Gateway integration to route to the correct backend endpoint `/business/jobber/flows`.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_automation_flows
    method: GET
    path: "/platform/v1/business/jobber/flows"
    expect:
      status: [200, 201]
```