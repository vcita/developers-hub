---
endpoint: "GET /platform/v1/clients/{client_id}/payment/client_packages"
domain: clients
tags: []
swagger: "swagger/clients/legacy/legacy_v1_clients.json"
status: deprecated
savedAt: "2026-02-04T16:30:00.000Z"
verifiedAt: "2026-02-04T16:30:00.000Z"
timesReused: 0
skip: true
skip_reason: "ENDPOINT NOT IMPLEMENTED - Controller action missing. Use alternative endpoint: GET /client/payments/v1/client_packages with Client token and matter_uid parameter."
---
# Get Client packages (DEPRECATED - NOT IMPLEMENTED)

## Summary
**THIS ENDPOINT IS NOT IMPLEMENTED.** The route exists but the controller action (`index`) is missing. All requests return 422 Unauthorized regardless of token type.

## Alternative Endpoint
Use `GET /client/payments/v1/client_packages` instead:
- Requires **Client Token** (not Staff/Directory/Application)
- Requires `matter_uid` query parameter
- Returns list of client packages for the authenticated client

## Root Cause Analysis
1. Route defined in routes.rb: `GET /platform/v1/clients/{client_id}/payment/client_packages`
2. Routes to: `Platform::V1::Clients::Payment::ClientPackagesController#index`
3. Controller exists but has NO `index` action - only: `update_usage`, `validate`, `available_credits`, `is_valid`, `redemptions_data`, `show`
4. Authentication layer runs before action dispatch, returning 422 before Rails can report "action not found"

## Critical Learnings

- The rswag spec tests mock the response - they test swagger generation, not actual functionality
- This is a documentation bug where an unimplemented endpoint was documented as functional
- The `x-auth-type: "Application & Application User"` in the spec is misleading since the endpoint doesn't work

## Test Request (WILL FAIL)

```json
{
  "method": "GET",
  "path": "/platform/v1/clients/{{resolved.client_id}}/payment/client_packages"
}
```