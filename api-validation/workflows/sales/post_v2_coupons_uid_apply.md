---
endpoint: POST /v2/coupons/{uid}/apply
domain: sales
tags: [coupons]
swagger: swagger/sales/legacy/coupons.json
status: verified
savedAt: 2026-02-08T20:00:00.000Z
verifiedAt: 2026-02-08T20:00:00.000Z
timesReused: 0
tokens: [staff]
---

# Apply Coupon to Entity

## Summary

Applies a coupon to a payment status (or appointment/event attendance). Available for **Staff tokens**.

**Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required: This endpoint requires the fallback API to function properly.

> ⚠️ **Important**: The `entity_type` must be one of `payment_status`, `payment`, `appointment`, or `event_attendance`. The `entity_id` for `payment_status`/`payment` types is a **payment request UID** (which equals the payment status UID), obtainable from `GET /business/payments/v1/payment_requests`. Do NOT use `/platform/v1/payment_statuses` (returns 404) or `/platform/v1/payments` (different entity).

## Prerequisites

```yaml
steps:
  - id: get_payment_request
    description: "Fetch a payment request to get a payment status UID"
    method: GET
    path: "/business/payments/v1/payment_requests"
    token: staff
    params:
      per_page: "1"
    extract:
      payment_status_uid: "$.data.payment_requests[0].uid"
    expect:
      status: 200
    onFail: abort

  - id: create_coupon
    description: "Create a test coupon for applying"
    method: POST
    path: "/v2/coupons"
    body:
      name: "Test Apply Coupon {{timestamp}}"
      coupon_type: "percent"
      amount: 10
      starts_at: "{{current_date}}"
      expires_at: "{{future_datetime}}"
    extract:
      coupon_uid: "$.uid"
    expect:
      status: 200
    onFail: abort
```

## UID Resolution Procedure

| UID Field | Source Endpoint | Extract Path | Notes |
|-----------|-----------------|--------------|-------|
| coupon_uid | POST /v2/coupons | $.uid | Create a new coupon |
| payment_status_uid | GET /business/payments/v1/payment_requests | $.data.payment_requests[0].uid | Payment request UID = payment status UID |

## Test Request

```yaml
steps:
  - id: main_request
    method: POST
    path: "/v2/coupons/{{coupon_uid}}/apply"
    body:
      entity_type: "payment_status"
      entity_id: "{{payment_status_uid}}"
    expect:
      status: 200
```

## Known Issues

### Issue: Payment Not Found (404)

**Description**: If `entity_id` is a regular Payment UID (from `/platform/v1/payments`) instead of a PaymentStatus UID, the endpoint returns 404 "Payment Not Found".

**Root Cause**: The controller looks up `PaymentStatus.find_by_uid(entity_id)`, not `Payment.find_by_uid`. Payment and PaymentStatus are separate models with separate UID spaces.

**Workaround**: Use payment request UIDs from `GET /business/payments/v1/payment_requests` as the `entity_id`.

### Issue: Coupon cannot be applied (422)

**Description**: If the Redis lock cannot be acquired (concurrent apply), the endpoint returns 422 "Coupon cannot be applied at the moment".

**Root Cause**: `PaymentStatus#apply_coupon` uses a Redis lock to prevent double-apply race conditions.

## Critical Learnings

1. **Payment Status UID = Payment Request UID**: Use `GET /business/payments/v1/payment_requests` to obtain payment status UIDs
2. **Do NOT use `/platform/v1/payment_statuses`**: This endpoint returns 404 - it's not a real API endpoint
3. **Do NOT use `/platform/v1/payments`**: These return Payment objects, not PaymentStatus objects
4. **No entity type restriction**: Unlike the `CouponRedemptionsAPI` module, the v2 controller's `apply` method does NOT check `COUPON_ALLOWED_ENTITIES` - it works with any PaymentStatus
5. **Coupon must have starts_at and expires_at**: The decorator crashes without these dates (nil comparison)
