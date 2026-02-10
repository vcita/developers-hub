---
endpoint: "PUT /platform/v1/payment/checkout/"
domain: sales
tags: [payment, checkout, webhook]
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: skip
skipReason: "Payment gateway webhook — requires PaymentProcessRequest records only created during live gateway checkout flows (e.g., Stripe). The PUT pay method has no PaymentStatus fallback unlike GET. Cannot achieve 2xx in test environment."
savedAt: 2026-02-08T00:00:00.000Z
verifiedAt:
timesReused: 0
tokens: [staff]
useFallbackApi: true
---

# Update Payment Checkout (Webhook)

## Summary

Webhook endpoint called by external payment gateways (e.g., Stripe) to complete checkout sessions. The `pay` method in `CheckoutAPI` strictly requires a valid `PaymentProcessRequest` found via `find_by_url_key(params[:url_key])`. Unlike the GET checkout endpoint which falls back to `PaymentStatus.find_by_uid`, the PUT endpoint has **no fallback** — if the `PaymentProcessRequest` is nil or lacks a `payment_status`, it returns 422 `no_content`.

**Token Type**: This endpoint requires a **staff token**.

> **Skipped**: Cannot test in automated environment. `PaymentProcessRequest` records are only created as side effects of live payment gateway checkout sessions. No API exists to create them directly.

> ⚠️ Fallback API Required

## Response Codes

| Status | Meaning |
|--------|---------|
| 201 | Success - Payment processed via checkout |
| 422 | `no_content` - PaymentProcessRequest not found or missing payment_status |
| 422 | `Unauthorized` - Authorization failed |
| 422 | `Already_paid` - Transaction already exists |

## Authentication

| Token Type | Works | Notes |
|------------|-------|-------|
| Staff | ✅ | Requires fallback API; authorization checks business match |
| Directory | ❌ | Returns 422 Unauthorized |
| App | ❌ | Returns 422 Unauthorized |

## Prerequisites

```yaml
steps:
  - id: get_payment_request
    description: "Fetch a pending payment request to use as url_key (will NOT work — PUT requires PaymentProcessRequest, not PaymentRequest)"
    method: GET
    path: "/business/payments/v1/payment_requests"
    params:
      per_page: "1"
      status: "pending"
    extract:
      payment_request_uid: "$.data.payment_requests[0].uid"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: checkout_webhook
    description: "Test checkout webhook completion (expected to fail — no PaymentProcessRequest exists)"
    method: PUT
    path: "/platform/v1/payment/checkout/"
    token: staff
    useFallbackApi: true
    body:
      url_key: "{{payment_request_uid}}"
      transaction_id: "txn_test_checkout_123"
      type: "checkout.session.completed"
      created: "{{tomorrow_datetime}}"
      payment_method: "Credit Card"
    expect:
      status: [200, 201]
```

## Parameters Reference

### Body Parameters (Webhook Payload)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url_key | string | Yes | PaymentProcessRequest.url_key (generated during gateway checkout flow) |
| transaction_id | string | Yes | External payment gateway transaction ID |
| type | string | Yes | Must be "checkout.session.completed" |
| created | string | Yes | Payment creation timestamp |
| payment_method | string | No | One of: "card", "Credit Card", "us_bank_account", "Bank Payment - ACH" |
| customer_id | string | No | Customer unique ID for card saving |
| card | object | No | Saved card information |
| ps_id | string | No | Payment status UID for sync flow |
| sync_flow | boolean | No | Post-checkout sync indicator |
| amount | number | No | Charged amount for sync flow |
| tips | array | No | Tip amounts (max 1 per payment) |
| fees | array | No | Fee amounts (max 1 per payment, requires name) |
| state | string | No | Payment state ("pending" only) |

## Critical Learnings

1. **PaymentProcessRequest strictly required**: `pay` method calls `PaymentProcessRequest.find_by_url_key(params[:url_key])` with NO fallback to `PaymentStatus`
2. **No PaymentStatus fallback**: Unlike `GET /payment/checkout/{url_key}` which falls back to `PaymentStatus.find_by_uid`, the PUT endpoint returns `no_content` if PPR is nil
3. **PPR creation is a side effect**: `PaymentProcessRequest` records are created during live payment gateway checkout sessions — no direct API to create them
4. **Type validation**: Strictly validates `type == "checkout.session.completed"` before PPR lookup
5. **Authorization flow**: Uses `CheckoutAPI.authorize_action` which checks user-business match via `authorize_params[:type] == 'user'`
6. **Tips/fees validation**: Max 1 tip, max 1 fee per payment; fee requires a `name` (max 35 chars); amounts must be positive numbers
7. **Duplicate protection**: Checks `Payment.where(pay_key: transaction_id, business_id: business.id, payment_status_uid: ps.uid).exists?`

## Known Issues

### Issue: Cannot Test Without Live Payment Gateway

**Description**: The PUT checkout endpoint (`CheckoutAPI.pay`) requires a `PaymentProcessRequest` record that is only created during actual payment gateway checkout flows. There is no API endpoint to create `PaymentProcessRequest` records directly.

**Root Cause**: `PaymentProcessRequest` is a transient record created by the checkout initiation flow (client-side gateway integration). The `url_key` is generated and stored in the PPR when a client starts a checkout session.

**Workaround**: None available. The GET endpoint can use `PaymentStatus.uid` as a fallback, but the PUT/pay method does not have this fallback path.

## Notes

- This is a webhook endpoint designed for payment gateway callbacks (Stripe, etc.)
- Returns 201 on successful payment processing (when called by real gateways)
- Validates tips/fees arrays and payment method values against allowed list
- Supports card saving and customer ID mapping after successful payment
- Uses Redis-based distributed locking (`after_checkout_ps_{uid}`) to prevent concurrent processing
- Authentication handled by `Platform::V1::BaseController`
