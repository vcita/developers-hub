---
endpoint: "POST /platform/v1/payment/client_packages"
domain: sales
tags: [client_packages, payments, packages]
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: "2026-01-27T04:22:09.837Z"
verifiedAt: 2026-02-08T09:02:05.000Z
timesReused: 0
useFallbackApi: true
tokens: [staff]
---

# Create Client Package

## Summary

Creates a client package subscription, assigning a payment package to a specific client. The package becomes active immediately with the specified validity period. This endpoint requires a **staff token** and must use the fallback API.

**Token Type**: This endpoint requires a **Staff token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint.

## Response Codes

| Status | Meaning |
|--------|---------|
| 201 | Success - Client package created |
| 422 | Unprocessable Entity - Validation failed |
| 401 | Unauthorized - Invalid or missing token |
| 500 | Internal Server Error |

## Authentication

| Token Type | Works | Notes |
|------------|-------|-------|
| Staff | ✅ | Full access to business packages |
| Directory | ❌ | Returns 422 Unauthorized |

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

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Extract Path | Notes |
|-----------|-----------------|--------------|-------|
| client_id | GET /platform/v1/clients | $.data.clients[0].id | Use first available client |
| package_id | GET /platform/v1/payment/packages | $.data.packages[0].id | Use first available package |

### Resolution Steps

**client_id:**
1. Call `GET /platform/v1/clients?business_id={{business_id}}&per_page=1`
2. Extract `$.data.clients[0].id` from response
3. If empty, endpoint cannot be tested (skip with reason)

**package_id:**
1. Call `GET /platform/v1/payment/packages` with staff token and fallback API
2. Extract `$.data.packages[0].id` from response
3. If no packages exist, endpoint cannot be tested (skip with reason)

## Test Request

```yaml
steps:
  - id: create_client_package
    description: "Create a client package subscription"
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

## Parameters Reference

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| client_id | string | Yes | Client unique identifier |
| package_id | string | Yes | Package unique identifier |
| price | number | No | Custom price (defaults to package price) |
| valid_from | string | Yes | Start date in YYYY-MM-DD format |
| valid_until | string | No | End date in YYYY-MM-DD format (defaults based on package expiration) |
| conversation_id | string | No | Conversation/matter UID to associate |

## Critical Learnings

1. **Staff Token Required**: Despite the existing workflow using directory token, this endpoint requires staff authentication. The controller uses `current_user.staff.business.uid` for business context.
2. **Fallback API Required**: Must use fallback API URL as main gateway doesn't support this endpoint
3. **Date Format**: `valid_from` and `valid_until` must be in YYYY-MM-DD format
4. **Price Override**: The `price` parameter allows overriding the package's default price
5. **Auto-Conversation**: If no `conversation_id` provided, system creates/uses default conversation for the client

## Notes

- Creates payment request in "overdue" state by default
- Automatically assigns booking credits based on package configuration
- Returns full client package details including booking credits and products
- The package must be active and belong to the same business as the client