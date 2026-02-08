---
endpoint: "GET /business/payments/v1/payouts/{provider_payout_id}"
domain: sales
tags: [payouts, payments]
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-02-08T16:33:35.000Z"
verifiedAt: "2026-02-08T16:33:35.000Z"
timesReused: 0
tokens: [staff]
useFallbackApi: true
---

# Get Payout by Provider ID

## Summary

Retrieves a provider payout by its provider_payout_id. This endpoint requires **staff token** and must use the fallback API due to API gateway routing issues.

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
  - id: create_payout
    description: "Create a payout to retrieve"
    method: POST
    path: "/business/payments/v1/payouts"
    token: staff
    useFallbackApi: true
    body:
      payout:
        provider_payout_id: "po_test_{{timestamp}}"
        provider_created_time: "2024-01-01T08:00:00Z"
        provider_updated_time: "2024-01-02T18:00:00Z"
        status: "completed"
        total_amount: 333.55
        net: 300
        fee: 33.54
        other: 0.01
        processed_time: "2024-01-02T18:00:00Z"
        currency: "USD"
        account_number: "1111"
    extract:
      provider_payout_id: "$.data.payout.provider_payout_id"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_payout
    description: "Get the created payout by provider_payout_id"
    method: GET
    path: "/business/payments/v1/payouts/{{provider_payout_id}}"
    token: staff
    expect:
      status: [200]
```

## Parameters Reference

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| provider_payout_id | string | Yes | Provider payout identifier (e.g., "po_test_12345678") |

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Payout retrieved |
| 401 | Unauthorized - Invalid token |
| 404 | Not Found - Provider payout doesn't exist or doesn't belong to business |
| 422 | Validation Error - Missing provider_payout_id |

## Critical Learnings

1. **Staff Token Required**: Only staff tokens work for this endpoint, not directory tokens
2. **Fallback API Mandatory**: Main API gateway blocks tokens for `/business/payments/v1/*` paths
3. **Business Scope**: Payout must belong to the staff member's business
4. **Prerequisites Essential**: Provider payout must exist before retrieving (requires creation)

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

- The provider_payout_id must be for a payout within the staff member's business
- Payouts are keyed by provider_payout_id, not internal UID
- The endpoint validates business_uid automatically based on the staff token