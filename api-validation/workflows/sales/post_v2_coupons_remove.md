---
endpoint: POST /v2/coupons/remove
domain: sales
tags: [coupons]
swagger: swagger/sales/legacy/coupons.json
status: verified
savedAt: 2026-02-08T20:10:00.000Z
verifiedAt: 2026-02-08T20:10:00.000Z
timesReused: 0
tokens: [staff]
---

# Remove Coupon from Entity

## Summary

Removes a previously applied coupon from an entity (payment status, appointment, or event attendance). Available for **Staff tokens**.

This reverses the discount that was applied via the Apply Coupon endpoint. If no coupon is currently applied, the endpoint still returns 200 with the entity data.

**Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required: This endpoint requires the fallback API to function properly.

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
    description: "Create a test coupon for apply/remove cycle"
    method: POST
    path: "/v2/coupons"
    body:
      name: "Test Remove Coupon {{timestamp}}"
      coupon_type: "percent"
      amount: 10
      starts_at: "{{current_date}}"
      expires_at: "{{future_datetime}}"
    extract:
      coupon_uid: "$.uid"
    expect:
      status: 200
    onFail: abort

  - id: apply_coupon
    description: "Apply coupon to payment status first so it can be removed"
    method: POST
    path: "/v2/coupons/{{coupon_uid}}/apply"
    body:
      entity_type: "payment_status"
      entity_id: "{{payment_status_uid}}"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    method: POST
    path: "/v2/coupons/remove"
    body:
      entity_type: "payment_status"
      entity_id: "{{payment_status_uid}}"
    expect:
      status: 200
```

## Critical Learnings

1. **Payment Status UID = Payment Request UID**: Use `GET /business/payments/v1/payment_requests` to obtain payment status UIDs
2. **No coupon UID needed**: Unlike the apply endpoint, remove uses `entity_type`/`entity_id` only - no coupon UID in the path
3. **Idempotent**: If no coupon is applied, the endpoint still returns 200 with the entity data (no error)
4. **Coupon must have starts_at and expires_at**: Required for creation, decorator crashes without them
