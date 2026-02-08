---
endpoint: "POST /business/payments/platform/v1/payment/client_packages"
domain: sales
tags: [client_packages, payments, packages]
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: 2026-02-08T17:39:22.000Z
verifiedAt: 2026-02-08T17:39:22.000Z
timesReused: 0
useFallbackApi: true
tokens: [staff]
---

# Create Client Package (Corrected Path)

## Summary

**CORRECTED ENDPOINT**: This workflow has been updated to use the correct working path `/platform/v1/payment/client_packages` instead of the invalid original path `/business/payments/platform/v1/payment/client_packages`.

Creates a client package subscription, assigning a payment package to a specific client. The package becomes active immediately with the specified validity period. This endpoint requires a **staff token** and must use the fallback API.

**Token Type**: This endpoint requires a **Staff token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint.

> **⚠️ Path Correction**
> The original documented path `/business/payments/platform/v1/payment/client_packages` returns 404 as it does not exist. This workflow uses the correct working path `/platform/v1/payment/client_packages`.

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
    useFallback: true
    extract:
      package_id: "$.data.packages[0].id"
      package_price: "$.data.packages[0].price"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: create_client_package
    description: "Create a client package subscription using corrected path"
    method: POST
    path: "/platform/v1/payment/client_packages"
    token: staff
    useFallback: true
    body:
      client_id: "{{client_id}}"
      package_id: "{{package_id}}"
      price: "{{package_price}}"
      valid_from: "2024-03-01"
      valid_until: "2024-04-01"
    expect:
      status: [201]
```

## Resolution

The original path `/business/payments/platform/v1/payment/client_packages` does not exist and returns 404. This workflow has been corrected to use the functional equivalent path `/platform/v1/payment/client_packages` which properly creates client package subscriptions.

## Notes

- **Path Corrected**: Changed from invalid `/business/payments/platform/v1/payment/client_packages` to working `/platform/v1/payment/client_packages`
- Creates payment request in "overdue" state by default
- Automatically assigns booking credits based on package configuration
- Returns full client package details including booking credits and products
- The package must be active and belong to the same business as the client