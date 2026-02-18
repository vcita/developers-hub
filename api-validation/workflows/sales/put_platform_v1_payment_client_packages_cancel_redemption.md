---
endpoint: PUT /platform/v1/payment/client_packages/cancel_redemption
domain: sales
tags: [client_packages, payments, redemptions]
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: verified
savedAt: 2026-01-26T15:29:29.195Z
verifiedAt: 2026-02-08T10:02:34.000Z
timesReused: 0
expectedOutcome: 422
expectedOutcomeReason: "The created client package has no booking redemptions. Cancel redemption requires an existing redemption, which cannot be created in this environment."
tokens: [staff]
---

# Cancel Client Package Redemption

## Summary

Cancels a booking redemption for a client package. This endpoint requires a valid payment_status_id from a client package that has an active booking redemption. Since redemptions cannot be easily created in test environments, this endpoint typically returns 422 with "There is no booking redemption for given payment status".

**Token Type**: This endpoint requires a **Staff token**.

## Prerequisites

```yaml
steps:
  - id: get_client_id
    description: "Fetch a client ID for the business"
    method: GET
    path: "/platform/v1/clients"
    token: staff
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_id: "$.data.clients[0].id"
    expect:
      status: [200]
    onFail: abort

  - id: get_package_id
    description: "Fetch a package ID for the business"
    method: GET
    path: "/platform/v1/payment/packages"
    token: staff
    extract:
      package_id: "$.data.packages[0].id"
      package_price: "$.data.packages[0].price"
    expect:
      status: [200]
    onFail: abort

  - id: create_client_package
    description: "Create a client package to get a payment_status_id"
    method: POST
    path: "/platform/v1/payment/client_packages"
    token: staff
    body:
      client_id: "{{client_id}}"
      package_id: "{{package_id}}"
      price: "{{package_price}}"
      valid_from: "2024-03-01"
      valid_until: "2024-04-01"
    extract:
      payment_status_id: "$.data.client_package.payment_status_id"
    expect:
      status: [200, 201]
    onFail: abort
```

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| payment_status_id | GET /platform/v1/clients/{client_id}/payment/client_packages | data.client_packages[0].payment_status_id | POST /platform/v1/payment/client_packages | - |

### Resolution Steps

**payment_status_id**:
1. Call `GET /platform/v1/clients/{client_id}/payment/client_packages`
2. Extract from response: `data.client_packages[0].payment_status_id`
3. If empty, create via `POST /platform/v1/payment/client_packages`

## Test Request

```yaml
steps:
  - id: main_request
    description: "Cancel client package redemption"
    method: PUT
    path: "/platform/v1/payment/client_packages/cancel_redemption"
    token: staff
    body:
      payment_status_id: "{{payment_status_id}}"
    expect:
      status: [422]
```

## Parameters Reference

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| payment_status_id | string | Yes | Payment status ID from a client package |

## Critical Learnings

1. **Staff Token Required**: This endpoint requires staff authentication with fallback API
2. **Expected 422 Response**: Since redemptions cannot be easily created in test environments, this endpoint typically returns 422 with "There is no booking redemption for given payment status"
3. **Real Redemptions Needed**: To get a 200 response, the client package would need to have actual booking redemptions that can be cancelled
4. **Fallback API Required**: Must use fallback API URL as main gateway doesn't support this endpoint

## Notes

- This endpoint is designed to cancel active booking redemptions for client packages
- In production, clients would have actual redemptions from booking services using their package credits
- The 422 response is expected behavior when no redemptions exist to cancel