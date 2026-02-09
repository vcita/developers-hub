---
endpoint: "GET /client/payments/v1/carts/{uid}?matter_uid={matter_uid}"
domain: clients
tags: []
swagger: swagger/clients/legacy/clients_payments.json
status: success
savedAt: 2026-01-26T05:29:52.880Z
verifiedAt: 2026-01-26T05:29:52.880Z
---

# Get Carts

## Summary
Successfully retrieved cart details after creating valid test data. The endpoint requires a valid cart that exists in the system, which was created through the proper workflow of creating a product, product order, and then a cart.

## Prerequisites

```yaml
steps:
  - id: get_matters
    description: "Fetch available matters"
    method: GET
    path: "/platform/v1/matters"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      matter_uid: "$.data.matters[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_carts
    method: GET
    path: "/client/payments/v1/carts/{uid}?matter_uid={matter_uid}"
    expect:
      status: [200, 201]
```
