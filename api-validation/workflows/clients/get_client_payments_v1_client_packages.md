---
endpoint: GET /client/payments/v1/client_packages
domain: clients
tags: [client_packages, payments, client_auth, matter_required]
status: verified
savedAt: 2026-01-22T23:52:01.343Z
verifiedAt: 2026-01-22T23:52:01.343Z
timesReused: 0
---
# Get Client packages

## Summary
List of Client Packages endpoint requires client authentication and matter_uid parameter

## Prerequisites
Need a valid matter_uid and client-level authentication

## How to Resolve Parameters
1. Use 'client' token type for authentication (not 'staff' or other types)
2. Add required query parameter matter_uid with a valid matter ID
3. Optional parameters include page, per_page, sort, and filter for pagination and sorting
4. The endpoint returns a list of client packages with detailed information including booking credits and products

## Critical Learnings

- **Requires client token authentication** - This endpoint requires 'client' token type, not 'staff' - returns 401 if using wrong token type
- **matter_uid parameter is required** - Must provide matter_uid as query parameter to specify which matter's packages to fetch
- **Returns comprehensive package data** - Response includes package details, booking credits, products, payment status, and usage information

## Verified Successful Request

```json
{
  "method": "GET",
  "path": "/client/payments/v1/client_packages?matter_uid=7mxnm58ypxss5f4j"
}
```

## Documentation Fix Suggestions

No documentation issues found.