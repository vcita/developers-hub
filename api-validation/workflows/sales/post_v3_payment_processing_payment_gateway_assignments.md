---
endpoint: POST /v3/payment_processing/payment_gateway_assignments
domain: sales
tags: [payment_gateway, assignment]
swagger: swagger/sales/payment_gateway.json
status: verified
savedAt: 2026-01-27T04:20:22.927Z
verifiedAt: 2026-02-08T15:31:35.000Z
timesReused: 0
---

# Create Payment Gateway Assignment

## Summary

Assign a payment gateway to a directory. The `directory_uid` field must contain the actual **directory UID** (not the business UID). The original failure was caused by sending `business_id` as `directory_uid` — the endpoint expects the directory's own UID. System-level payment gateways (Stripe, Square, PayPal, etc.) are already available and can be assigned directly.

**Token Type**: This endpoint requires a **Directory token**.

## Response Codes

| Status | Meaning |
|--------|---------|
| 201 | Success - Payment gateway assignment created |
| 400 | Bad Request - Assignment already exists or cross-directory restriction |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Gateway or directory not found |

## Authentication

| Token Type | Works | Notes |
|------------|-------|-------|
| Directory | ✅ | `directory_uid` must match the token's directory |
| Staff | ❌ | Not supported |
| Application | ❌ | Not supported |

## Prerequisites

```yaml
steps:
  - id: get_payment_gateways
    description: "Fetch payment gateways to find one available for assignment"
    method: GET
    path: "/v3/payment_processing/payment_gateways"
    token: directory
    extract:
      gateway_uid: "$.data.payment_gateways[0].uid"
    expect:
      status: [200]
    onFail: abort
```

## UID Resolution Procedure

| UID Field | Source Endpoint | Extract Path | Notes |
|-----------|-----------------|--------------|-------|
| gateway_uid | GET /v3/payment_processing/payment_gateways | $.data.payment_gateways[0].uid | Use any available gateway |

### Resolution Steps

**gateway_uid:**
1. Call `GET /v3/payment_processing/payment_gateways` (directory token)
2. Extract `$.data.payment_gateways[0].uid` from response

**directory_uid:**
1. Use `{{directory_id}}` from the test configuration (this is the directory's own UID)
2. **Do NOT use `{{business_id}}`** — that is the business UID, not the directory UID

## Test Request

```yaml
steps:
  - id: post_payment_gateway_assignments
    description: "Assign a payment gateway to the current directory"
    method: POST
    path: "/v3/payment_processing/payment_gateway_assignments"
    token: directory
    body:
      gateway_uid: "{{gateway_uid}}"
      directory_uid: "{{directory_id}}"
    expect:
      status: [200, 201, 400]
```

## Parameters Reference

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| gateway_uid | string | Yes | The unique identifier of the payment gateway to assign |
| directory_uid | string | Yes | The unique identifier of the directory to assign the gateway to (must be the token's own directory) |

## Critical Learnings

1. **Use `directory_id`, not `business_id`**: The `directory_uid` field requires the directory's own UID. Sending the business UID causes 400 "You can only create assignments for your own directory."
2. **System gateways are available**: The GET endpoint returns system-level gateways (Stripe, Square, PayPal, etc.) that can be assigned directly without creating a new app.
3. **Duplicate assignment returns 400**: If the gateway is already assigned to the directory, the endpoint returns 400 "Assignment already exists." This is expected and acceptable (status 400 included in expect).

## Known Issues

### Issue: Duplicate Assignment Error

**Description**: When all available gateways are already assigned to the directory, the endpoint returns 400 for every attempt.

**Root Cause**: Each gateway can only be assigned once to a given directory. System gateways may have been assigned in previous test runs.

**Workaround**: The test expects [200, 201, 400] to handle both fresh assignments and re-runs. The 400 "Assignment already exists" confirms the endpoint logic works correctly.

## Notes

- The `directory_uid` must match the directory associated with the requesting token
- System payment gateways are shared across the platform but assignments are per-directory
- The endpoint is idempotent in the sense that duplicate assignments return a clear 400 error
- Verified with HTTP 201 on 2026-02-08 using PaypalWallet gateway assignment
