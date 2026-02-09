---
endpoint: "GET /platform/v1/payment/packages/{package_id}"
domain: sales
tags: [packages, payments]
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: verified
savedAt: 2026-02-06T20:49:00.000Z
verifiedAt: 2026-02-08T15:42:00.000Z
timesReused: 0
useFallbackApi: true
tokens: [staff]
---
# Get Package

## Summary

Retrieves a single payment package by its ID. This endpoint requires a **staff token** and must use the fallback API URL.

**Token Type**: This endpoint requires a **staff token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint.

## Authentication

| Token Type | Works | Notes |
|------------|-------|-------|
| Staff | ✅ | Full access to business packages |
| Directory | ❌ | Returns 401 Unauthorized |

## Prerequisites

```yaml
steps:
  - id: get_packages
    description: "Fetch packages list to get a valid package ID"
    method: GET
    path: "/platform/v1/payment/packages"
    token: staff
    useFallback: true
    extract:
      package_id: "$.data.packages[0].id"
    expect:
      status: [200]
    onFail: abort
```

## UID Resolution Procedure

How to dynamically obtain the package_id parameter:

| UID Field | Source Endpoint | Extract Path | Notes |
|-----------|-----------------|--------------|-------|
| package_id | GET /platform/v1/payment/packages | $.data.packages[0].id | Use first available package |

### Resolution Steps

**package_id:**
1. Call `GET /platform/v1/payment/packages` with staff token and fallback API
2. Extract `$.data.packages[0].id` from response
3. If no packages exist, endpoint cannot be tested (skip with reason)

## Test Request

```yaml
steps:
  - id: main_request
    description: "Get a single package by ID"
    method: GET
    path: "/platform/v1/payment/packages/{{package_id}}"
    token: staff
    useFallback: true
    expect:
      status: [200]
```

## Parameters Reference

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| package_id | string | Yes | Package unique identifier |

## Critical Learnings

1. **Staff Token Required**: Despite the path pattern suggesting directory token, this endpoint requires staff authentication
2. **Fallback API Required**: Must use fallback API URL as main gateway doesn't support this endpoint
3. **Business Context**: Controller uses `current_user.staff.business.uid` for business context

## Notes

- The controller inherits from `Platform::V1::BaseController` which expects staff tokens
- Package data includes services, products, taxes, and booking counts
- Returns full package details including items and associated services