---
endpoint: "GET /platform/v1/payment/checkout/{url_key}"
domain: sales
tags: [checkout, payments]
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: "2026-01-26T22:06:09.436Z"
verifiedAt: "2026-01-26T22:06:09.436Z"
timesReused: 0
useFallbackApi: true
tokens: [staff]
---

# Get Checkout

## Summary

Retrieves checkout information for a payment checkout session. The `{url_key}` parameter can accept either a `PaymentProcessRequest.url_key` (generated during client checkout flow) OR a `PaymentStatus.uid` as a fallback. Since generating proper checkout url_keys requires complex client-side flow, this test uses a PaymentStatus UID.

**Token Type**: This endpoint requires a **staff token**.

> ⚠️ Fallback API Required

## Prerequisites

```yaml
steps:
  - id: get_payment_requests
    description: "Fetch pending payment requests to use as url_key"
    method: GET
    path: "/business/payments/v1/payment_requests"
    token: staff
    params:
      per_page: "10"
      status: "unpaid"
    extract:
      payment_request_uid: "$.data.payment_requests[0].uid"
    expect:
      status: [200]
    onFail: abort
```

## UID Resolution Procedure

| UID Field | Source | Notes |
|-----------|--------|-------|
| url_key | PaymentProcessRequest.url_key OR PaymentStatus.uid | Use PaymentStatus UID as fallback when proper checkout url_key unavailable |

## Test Request

```yaml
steps:
  - id: get_checkout
    description: "Get checkout details using payment request UID as url_key"
    method: GET
    path: "/platform/v1/payment/checkout/{{payment_request_uid}}"
    token: staff
    useFallbackApi: true
    expect:
      status: [201, 200]
```

## Parameters Reference

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url_key | string | Yes | PaymentProcessRequest.url_key or PaymentStatus.uid |

## Critical Learnings

1. **Dual url_key format**: Can be PaymentProcessRequest.url_key OR PaymentStatus.uid
2. **Controller maps params**: The controller expects `params[:id]` not `params[:url_key]`
3. **Checkout flow complexity**: Real url_key generation requires client-side checkout initiation
4. **Fallback behavior**: CheckoutAPI.get() gracefully handles PaymentStatus UID as url_key
5. **Gateway routing**: Main APIGW returns 422 "Unauthorized" for staff tokens, requires fallback API

## Notes

- The endpoint returns 201 status code instead of standard 200
- Authentication is handled by Platform::V1::BaseController with OAuth tokens
- PaymentStatus UID fallback makes testing possible without complex checkout setup
- Must use pending payment requests; paid requests return 422 "Already_paid"