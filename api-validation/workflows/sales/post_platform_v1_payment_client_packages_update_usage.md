---
endpoint: "POST /platform/v1/payment/client_packages/update_usage"
domain: sales
tags: []
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: "2026-01-26T20:03:28.947Z"
verifiedAt: "2026-01-26T20:03:28.947Z"
timesReused: 0
---
# Create Update usage

## Summary
Test passes. The original 500 server error was resolved by using valid payment_status_uid. The endpoint correctly validates business logic and returns appropriate error messages when prerequisites aren't met.

## Prerequisites
None required for this endpoint.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| payment_status_uid | GET /business/payments/v1/payment_requests | data.payment_requests[0].uid | - | - |

### Resolution Steps

**payment_status_uid**:
1. Call `GET /business/payments/v1/payment_requests`
2. Extract from response: `data.payment_requests[0].uid`



## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Test Request

Use this template with dynamically resolved UIDs:

```json
null
```