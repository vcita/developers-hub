---
endpoint: POST /platform/v1/payment/packages
domain: sales
tags: [packages, payments]
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: verified
savedAt: 2026-02-08T19:35:00.000Z
verifiedAt: 2026-02-08T19:35:00.000Z
timesReused: 0
useFallbackApi: true
tokens: [staff]
---

# Create Payment Package

## Summary
Creates a payment package with services and pricing. This endpoint requires a **staff token** and must use the fallback API.

**Token Type**: This endpoint requires a **Staff token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway returns 422 Unauthorized.

## Prerequisites

```yaml
steps:
  - id: create_service
    description: "Create a service for the package"
    method: POST
    path: "/v2/settings/services"
    token: staff
    useFallback: true
    body:
      name: "Test Service {{now_timestamp}}"
      duration: 60
      price: 100
      currency: "USD"
      charge_type: "paid"
    extract:
      service_id: "$.id"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    description: "Create a payment package"
    method: POST
    path: "/platform/v1/payment/packages"
    token: staff
    useFallback: true
    params:
      business_id: "{{business_id}}"
    body:
      name: "TestPkg {{now_timestamp}}"
      price: "25.0"
      currency: "USD"
      expiration: 12
      expiration_unit: "m"
      items: [{"total_bookings": 3, "services": [{"id": "{{service_id}}"}]}]
      products: []
      tax_uids: []
    expect:
      status: [200, 201]
```