---
endpoint: "GET /business/payments/v1/client_packages/{uid}"
domain: sales
tags: [client_packages, packages]
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T22:11:55.113Z"
verifiedAt: 2026-02-08T13:58:00.000Z
timesReused: 0
tokens: [staff]
useFallbackApi: true
---

# Get Client Package

## Summary

Retrieves a client package by UID. This endpoint requires **staff token** and must use the fallback API due to API gateway routing issues.

**Token Type**: This endpoint requires a **Staff token**.

> **Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway returns 401 for tokens on `/business/payments/v1/*` paths.

## Authentication

Available for **Staff** tokens only.

| Token Type | Works | Notes |
|------------|-------|-------|
| Staff | Yes | Works via fallback API |
| Directory | No | Returns 401 even with X-On-Behalf-Of header |

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
    description: "Create a client package to retrieve"
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
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_client_package
    description: "Get the created client package by UID"
    method: GET
    path: "/business/payments/v1/client_packages/{{client_package_uid}}"
    token: staff
    expect:
      status: [200]
```

## Parameters Reference

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| uid | string | Yes | Client package unique identifier |

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Client package retrieved |
| 401 | Unauthorized - Invalid token |
| 404 | Not Found - Client package doesn't exist |

## Critical Learnings

1. **Staff Token Required**: Only staff tokens work for this endpoint, not directory tokens
2. **Fallback API Mandatory**: Main API gateway blocks tokens for `/business/payments/v1/*` paths
3. **Prerequisites Essential**: Client package must exist before retrieving (requires full creation flow)

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
- Package creation requires referencing existing package templates and clients
