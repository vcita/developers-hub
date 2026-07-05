---
endpoint: GET /platform/v1/estimates
domain: sales
tags: [estimates]
swagger: swagger/sales/legacy/estimates.json
status: verified
savedAt: 2026-02-08T18:00:00.000Z
verifiedAt: 2026-02-08T18:00:00.000Z
timesReused: 0
tokens: [staff]
---
# List Estimates

## Summary

Lists all estimates for a business. **Token Type**: Requires a **staff token**.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "List all estimates for the business"
    method: GET
    path: "/platform/v1/estimates"
    params:
      business_id: "{{business_id}}"
    expect:
      status: [200]
```