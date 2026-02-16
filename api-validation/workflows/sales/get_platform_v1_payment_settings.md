---
endpoint: GET /platform/v1/payment/settings
domain: sales
tags: [settings, payments]
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: verified
savedAt: 2026-02-07T07:48:00.000Z
verifiedAt: 2026-02-07T07:48:40.000Z
timesReused: 0
tokens: [directory]
---
# Get Payment Settings

## Summary
Retrieves current payment settings for the business. Requires a **directory token** with `X-On-Behalf-Of`. Returns 201 in this environment.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Get payment settings"
    method: GET
    path: "/platform/v1/payment/settings"
    token: directory
    expect:
      status: [200, 201]
```
