---
endpoint: "PUT /platform/v1/payment_statuses/{id}/apply_coupon"
domain: sales
tags: [coupons, payment_statuses]
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: skip
savedAt: "2026-02-08T16:00:00.000Z"
timesReused: 0
tokens: [staff]
expectedOutcome: 422
expectedOutcomeReason: "All coupon management endpoints (/v3/sales/coupons, /v2/coupons) return 500 errors, making it impossible to create or fetch valid coupon codes required for testing this endpoint. The endpoint itself responds correctly (422 Invalid Coupon) but requires functional coupon creation/listing to obtain test data."
---

# Apply Coupon to Payment Status

## Summary

Applies a coupon code to a payment status to reduce the amount due. The `{id}` path parameter is a **payment status UID** (same as payment request UID). Requires a `coupon_code` parameter.

**Token Type**: Requires a **staff token**. The controller includes `Api::ClientAuthentication` and internally hardcodes `authorize_params: {type: 'client'}`, so staff tokens pass authorization.

> **⚠️ Testing Blocked**
> Cannot test due to broken coupon management endpoints. All coupon creation/listing endpoints return 500 "undefined method `<' for nil:NilClass".

## Prerequisites

```yaml
steps:
  - id: get_payment_request
    description: "Fetch payment requests with coupon-eligible payable types (Meeting, EventAttendance, PendingBooking, Cart)"
    method: GET
    path: "/business/payments/v1/payment_requests"
    token: staff
    params:
      per_page: "25"
      "filter[entity_type][in]": "Meeting,EventAttendance,PendingBooking,Cart"
    extract:
      payment_request_id: "$.data.payment_requests[?(@.state == 'pending' && @.amount != '0.0')].uid | [0]"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: apply_coupon
    description: "Apply a coupon code to a payment status"
    method: PUT
    path: "/platform/v1/payment_statuses/{{payment_request_id}}/apply_coupon"
    token: staff
    body:
      coupon_code: "TESTCOUPON"
    expect:
      status: [422]
```

## Parameters Reference

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Payment status UID (same as payment request UID) |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coupon_code | string | Yes | Coupon code to apply |

## Response Examples

### 200 - Success
```json
{
  "data": {
    "payment_status": {
      "amount_to_pay_h": "$8.00 USD",
      "balance_h": "$8.00 USD",
      "currency": "USD",
      "id": "ej27h4bjknw0g6dh",
      "price": "8.0",
      "price_before_coupon": "10",
      "state": "pending"
    }
  },
  "status": "OK"
}
```

### 422 - Invalid Coupon
```json
{
  "error": "Invalid Coupon",
  "error_code": "INVALID_COUPON",
  "status": "Error"
}
```

## Known Issues

### Issue: Payable type must be coupon-eligible

**Description**: The `validate_coupon` step inside `apply_coupon` checks `COUPON_ALLOWED_ENTITIES`, which only includes `Meeting`, `EventAttendance`, `PendingBooking`, and `Cart`. If the payment request's payable type is anything else (e.g., `ClientBookingPackage`, `Invoice`, `ProductOrder`), the endpoint returns 422 "Invalid Coupon" regardless of whether the coupon code is valid.

**Root Cause**: `Components::Payments::CouponRedemptionsAPI::COUPON_ALLOWED_ENTITIES = %w(Meeting EventAttendance PendingBooking Cart)` — non-listed types are rejected.

**Workaround**: Always filter payment requests by `entity_type=Meeting` (or `EventAttendance`, `Cart`) in the prerequisite step.

### Issue: Coupon management endpoints broken

**Description**: All coupon creation and listing endpoints (`/v3/sales/coupons`, `/v2/coupons`) return 500 "undefined method `<' for nil:NilClass", making it impossible to obtain valid coupon codes for testing.

**Impact**: This endpoint cannot be tested with 2xx responses until the coupon management system is fixed.

## Critical Learnings

1. **Payment Status ID Resolution**: Use payment request UID as the payment status ID
2. **Token Support**: Staff tokens work — controller hardcodes `authorize_params: {type: 'client'}` regardless of actual token
3. **Parameter Location**: `coupon_code` works as both query param and body param (Rails merges them)
4. **Payable Type Matters**: Only `Meeting`, `EventAttendance`, `PendingBooking`, and `Cart` payable types are coupon-eligible. Using `ClientBookingPackage` or `Invoice` returns 422 "Invalid Coupon"
5. **Prerequisite Dependency**: Requires functional coupon management endpoints to create test data
6. **Client Portal Usage**: The client portal calls this via `platformService.put(/payment_statuses/{uid}/apply_coupon, {coupon_code: coupon})`. The newer checkout flow uses the checkout session API instead (`GET /client/payments/v1/payment_requests/{uid}/checkout?coupon_code=X`)
7. **Angular Frontage Usage**: Uses a completely different endpoint: `POST /coupons/{coupon_uid}/apply` with `{entity_type, entity_id}`