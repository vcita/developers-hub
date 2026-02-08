---
endpoint: "GET /platform/v1/payment_statuses/{id}/validate_coupon"
domain: sales
tags: [coupons, payment_statuses]
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: "2026-01-27T04:30:17.718Z"
verifiedAt: "2026-02-08T06:09:12.398Z"
timesReused: 0
expectedOutcome: 422
expectedOutcomeReason: "No valid coupon exists in the test environment. The endpoint returns 422 'Invalid Coupon' for non-existent coupon codes."
tokens: [staff, directory, app]
---

# Validate Coupon

## Summary

Validates a coupon code against a payment status. The `{id}` path parameter is a **payment status UID** (not a payment request UID). Requires a `coupon_code` query parameter. Returns 200 with discount details for valid coupons, or 422 for invalid/expired coupons.

**Token Type**: This endpoint works with **Staff, Directory, and App tokens**.

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Coupon is valid, returns discounted price |
| 422 | Invalid Coupon - Coupon code does not exist or is expired |

## Prerequisites

```yaml
steps:
  - id: get_payment_requests
    description: "Fetch payment requests to get a payment status UID"
    method: GET
    path: "/business/payments/v1/payment_requests"
    token: staff
    params:
      per_page: "1"
    extract:
      payment_status_id: "$.data.payment_requests[0].uid"
    expect:
      status: [200]
    onFail: abort
```

## UID Resolution Procedure

| UID Field | Source Endpoint | Extract Path | Notes |
|-----------|-----------------|--------------|-------|
| payment_status_id | GET /business/payments/v1/payment_requests | $.data.payment_requests[0].uid | Use first available payment request |

## Test Request

```yaml
steps:
  - id: validate_coupon
    description: "Validate a coupon code against a payment status"
    method: GET
    path: "/platform/v1/payment_statuses/{{payment_status_id}}/validate_coupon"
    token: staff
    params:
      coupon_code: "TEST_COUPON_123"
    expect:
      status: [422]
```

## Parameters Reference

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Payment status UID |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coupon_code | string | Yes | Coupon code to validate |

## Authentication

Available for **Staff, Directory, and App** tokens.

| Token Type | Works | Notes |
|------------|-------|-------|
| Staff | ✅ | Requires same business as payment status |
| Directory | ✅ | Requires X-On-Behalf-Of header with business UID |
| App | ✅ | Requires appropriate OAuth scope |
| Client | ❓ | Not tested but controller sets authorize_params: {type: 'client'} |

## Known Issues

### Issue: No Valid Coupons in Test Environment

**Description**: The test environment does not have valid coupon codes, so the endpoint always returns 422 "Invalid Coupon".

**Root Cause**: No sample coupons are provisioned in the test database.

**Expected Behavior**: This 422 response is correct and expected when no valid coupons exist.

## Critical Learnings

1. **id is a payment status UID**: Not a payment request UID or invoice ID - use the UID from payment_requests response
2. **coupon_code is a query parameter**: Not a body parameter, pass as URL parameter
3. **422 is success for invalid coupons**: The endpoint correctly validates and returns 422 for non-existent coupon codes
4. **Multiple token types supported**: Staff, Directory, and App tokens all work