---
endpoint: "PUT /platform/v1/payment/packages/{package_id}"
domain: sales
tags: [packages, payment, update]
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: "2026-02-08T07:05:15.000Z"
verifiedAt: "2026-02-08T07:05:15.000Z"
timesReused: 0
tokens: [staff]
---

# Update Package

## Summary

Updates a payment package by ID. The request body must be wrapped in a `package` key and requires valid service IDs for items when provided. Works with **staff tokens** and requires the fallback API.

**Token Type**: This endpoint requires a **Staff token**.

## Prerequisites

```yaml
steps:
  - id: get_package_id
    description: "Fetch a package ID for the business"
    method: GET
    path: "/platform/v1/payment/packages"
    token: staff
    params:
      per_page: "1"
    extract:
      package_id: "$.data.packages[0].id"
    expect:
      status: [200]
    onFail: abort

  - id: get_service_id
    description: "Get a valid service ID for the items array"
    method: GET
    path: "/platform/v1/services"
    token: staff
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      service_id: "$.data.services[0].id"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: update_package
    description: "Update the payment package"
    method: PUT
    path: "/platform/v1/payment/packages/{{package_id}}"
    token: staff
    body:
      package:
        name: "Updated Test Package Name"
        price: 125
        currency: "USD"
        description: "Updated test package description"
        expiration: 30
        expiration_unit: "M"
        discount_amount: 15
        discount_unit: "F"
        online_payment_enabled: true
        products: []
    expect:
      status: [200]
```