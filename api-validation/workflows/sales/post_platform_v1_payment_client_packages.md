---
endpoint: "POST /platform/v1/payment/client_packages"
domain: sales
tags: []
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: "2026-01-27T04:22:09.837Z"
verifiedAt: "2026-01-27T04:22:09.837Z"
timesReused: 0
---

# Create Client packages

## Summary
Test passes after correcting date format. The valid_from and valid_until fields require ISO 8601 date format (YYYY-MM-DD), not placeholder strings.

## Prerequisites

```yaml
steps:
  - id: get_clients
    description: "Fetch available clients"
    method: GET
    path: "/platform/v1/clients"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_id: "$.data.clients[0].id"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_client_packages
    method: POST
    path: "/platform/v1/payment/client_packages"
    body:
      client_id: "{{client_id}}"
      package_id: "{{package_id}}"
      price: 1
      valid_from: 2024-01-01
      valid_until: 2024-12-31
    expect:
      status: [200, 201]
```
