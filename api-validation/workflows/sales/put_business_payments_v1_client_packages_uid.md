---
endpoint: "PUT /business/payments/v1/client_packages/{uid}"
domain: sales
tags: [client_packages, packages, booking_credits]
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T22:21:05.741Z"
verifiedAt: 2026-02-08T10:24:43.000Z
timesReused: 1
tokens: [staff]
useFallbackApi: true
---

# Update Client Package

## Summary

Updates a client package's booking credits and validity date. This endpoint requires **staff token** and must use the fallback API due to API gateway routing issues.

**Token Type**: This endpoint requires a **Staff token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway returns 401 for tokens on `/business/payments/v1/*` paths.

## Authentication

Available for **Staff** tokens only.

| Token Type | Works | Notes |
|------------|-------|-------|
| Staff | ✅ | Works via fallback API |
| Directory | ❌ | Returns 401 even with X-On-Behalf-Of header |
| App | ❌ | Returns 401 despite spec indicating support |

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
    useFallbackApi: true
    params:
      business_id: "{{business_id}}"
    extract:
      package_id: "$.data.packages[0].id"
    expect:
      status: [200]
    onFail: abort

  - id: create_client_package
    description: "Create a client package to update"
    method: POST
    path: "/platform/v1/payment/client_packages"
    token: staff
    useFallbackApi: true
    body:
      client_id: "{{client_id}}"
      package_id: "{{package_id}}"
      price: 1
      valid_from: "2026-02-08"
      valid_until: "2026-03-08"
    extract:
      client_package_uid: "$.data.client_package.id"
      booking_credit_id: "$.data.client_package.booking_credits[0].id"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: update_client_package
    description: "Update client package booking credits and validity"
    method: PUT
    path: "/business/payments/v1/client_packages/{{client_package_uid}}"
    token: staff
    body:
      client_package:
        booking_credits:
          - id: "{{booking_credit_id}}"
            total_bookings: 1
        valid_until: "2026-03-15"
    expect:
      status: [200]
```

## Parameters Reference

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| uid | string | Yes | Client package unique identifier |

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| client_package | object | Yes | Client package update data |
| client_package.booking_credits | array | No | Array of booking credit updates |
| client_package.booking_credits[].id | string | Yes | Booking credit ID to update |
| client_package.booking_credits[].total_bookings | number | Yes | New total bookings count (must be >= current usage) |
| client_package.valid_until | string | No | Package expiry date (ISO 8601 format, must be in future) |

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Client package updated |
| 401 | Unauthorized - Invalid token |
| 404 | Not Found - Client package doesn't exist |
| 422 | Unprocessable Entity - Validation failed (e.g., total_bookings < current usage) |

## Critical Learnings

1. **Staff Token Required**: Only staff tokens work for this endpoint, not directory tokens as originally documented
2. **Fallback API Mandatory**: Main API gateway blocks tokens for this path
3. **Booking Credits Validation**: total_bookings must be equal to or greater than current usage
4. **Prerequisites Essential**: Client package must exist before updating (requires full creation flow)
5. **Date Format**: Use ISO 8601 date format (YYYY-MM-DD) for valid_from and valid_until

## Known Issues

### Issue: Main API Gateway Blocks Tokens

**Description**: The main API gateway returns 401 for tokens on `/business/payments/v1/*` paths.

**Root Cause**: API gateway routing configuration doesn't properly handle token authentication for business payment endpoints.

**Workaround**: Use fallback API URL which bypasses the main gateway.

### Issue: Directory Token Authentication Failure

**Description**: Directory tokens return 401 even with X-On-Behalf-Of header.

**Root Cause**: This endpoint requires staff context for business operations.

**Workaround**: Use staff token instead of directory token.

## Notes

- The client package UID must be for a package within the staff member's business
- Reducing total_bookings below current usage will result in 422 validation error
- valid_until must be in the future and >= valid_from date
- Package creation requires referencing existing package templates and clients