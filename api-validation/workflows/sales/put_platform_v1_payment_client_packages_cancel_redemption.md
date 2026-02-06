---
endpoint: "PUT /platform/v1/payment/client_packages/cancel_redemption"
domain: sales
tags: []
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: "2026-01-26T15:29:29.195Z"
verifiedAt: "2026-01-26T15:29:29.195Z"
timesReused: 0
---
# Update Cancel redemption

## Summary
Test passes after UID resolution. Original HTTP 500 error was due to invalid placeholder value 'test_string'. With valid payment_status_id, endpoint returns proper HTTP 422 business logic error.

## Prerequisites
None required for this endpoint.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| payment_status_id | GET /platform/v1/clients/{client_id}/payment/client_packages | data.client_packages[0].payment_status_id | - | - |

### Resolution Steps

**payment_status_id**:
1. Call `GET /platform/v1/clients/{client_id}/payment/client_packages`
2. Extract from response: `data.client_packages[0].payment_status_id`
3. If empty, create via `POST /platform/v1/payment/client_packages`



## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Test Request

Use this template with dynamically resolved UIDs:

```json
null
```