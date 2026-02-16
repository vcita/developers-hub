---
endpoint: "GET /client/payments/v1/carts/{cart_uid}"
domain: clients
tags: []
swagger: "swagger/clients/legacy/clients_payments.json"
status: verified
savedAt: "2026-01-26T05:29:52.880Z"
verifiedAt: "2026-02-04T12:00:00.000Z"
timesReused: 0
useFallbackApi: true
tokens: [client]
requiresTestData: true
testDataDescription: "Business must have at least one cart. Carts are created via POST /client/payments/v1/carts."
---

# Get Cart

## Summary
Retrieves details of a specific cart by its unique identifier. Carts represent shopping cart sessions containing items for purchase.

**Token Type**: This endpoint requires a **Client token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint.

## Prerequisites

```yaml
steps:
  - id: get_carts_list
    description: "Fetch carts list to get a valid cart UID and matter UID"
    method: GET
    path: "/client/payments/v1/carts"
    token: client
    extract:
      cart_uid: "$.data.carts[0].uid"
      cart_matter_uid: "$.data.carts[0].matter_uid"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_cart
    method: GET
    path: "/client/payments/v1/carts/{{cart_uid}}?matter_uid={{cart_matter_uid}}"
    token: client
    expect:
      status: [200]
```

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Extract Path | Notes |
|-----------|-----------------|--------------|-------|
| cart_uid | GET /client/payments/v1/carts | $.data.carts[0].uid | Requires at least one cart to exist |
| matter_uid | GET /client/payments/v1/carts | $.data.carts[0].matter_uid | Extracted from the same cart |
