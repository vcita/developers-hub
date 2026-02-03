---
endpoint: "GET /v3/license/skus"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/license.json
status: success
savedAt: 2026-01-30T10:00:00.000Z
verifiedAt: 2026-01-30T10:00:00.000Z
---

# Get Skus

## Summary
Retrieves a list of all available SKUs (Stock Keeping Units) in the license system. SKUs are the foundational product codes that define what can be offered - packages, apps, and addons like SMS or staff seats. This endpoint is essential for obtaining valid SKU values before creating offerings.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_skus
    method: GET
    path: "/v3/license/skus"
    expect:
      status: [200, 201]
```
