---
endpoint: "PUT /business/payments/v1/packages/reorder"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T22:28:03.824Z"
verifiedAt: 2026-02-07T07:21:57.000Z
timesReused: 0
tokens: [directory]
useFallbackApi: true
---

# Update Reorder

## Summary
Test passes via **fallback API** with directory token + X-On-Behalf-Of header. The main APIGW returns 401 for directory tokens on this path. Uses real package IDs from GET /platform/v1/payment/packages.

**Token Type**: This endpoint requires a **Directory token** with `X-On-Behalf-Of` header.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway returns 401 for directory tokens on `/business/payments/v1/*` paths.

## Prerequisites

```yaml
steps:
  - id: get_package_ids
    description: "Fetch package IDs for reorder"
    method: GET
    path: "/platform/v1/payment/packages?business_id={{business_id}}"
    token: directory
    extract:
      package_id_1: "$.data.packages[0].id"
      package_id_2: "$.data.packages[1].id"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: put_reorder
    method: PUT
    path: "/business/payments/v1/packages/reorder"
    token: directory
    body:
      packages: [{"id":"{{package_id_1}}","order":1},{"id":"{{package_id_2}}","order":2}]
    expect:
      status: [200, 201]
```
