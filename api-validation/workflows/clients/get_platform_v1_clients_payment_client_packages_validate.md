---
endpoint: GET /platform/v1/clients/payment/client_packages/validate
domain: clients
tags: [client_packages, payments, validation, client_auth]
status: verified
savedAt: 2026-01-22T21:43:35.929Z
verifiedAt: 2026-01-22T21:43:35.929Z
timesReused: 0
---
# Get Validate

## Summary
Validate if client has package redemption available for a payment status

## Prerequisites
Need a valid payment_status_id (can use payment request UID) and client-level authentication

## How to Resolve Parameters
1. Use 'client' token type (not 'staff') for authentication
2. Add required query parameter payment_status_id with any valid payment status/request ID
3. The endpoint returns whether the client has package redemption available for that payment

## Critical Learnings

- **Requires client token authentication** - This endpoint requires 'client' token type, not 'staff' - returns 401 if using wrong token type
- **payment_status_id parameter required** - Must provide payment_status_id as query parameter, can use payment request UID
- **Returns package availability status** - Response indicates if client has package redemption available with has_package boolean

## Verified Successful Request

```json
{
  "method": "GET",
  "path": "/platform/v1/clients/payment/client_packages/validate?payment_status_id=zrka4653obs9drsg"
}
```

## Documentation Fix Suggestions

No documentation issues found.