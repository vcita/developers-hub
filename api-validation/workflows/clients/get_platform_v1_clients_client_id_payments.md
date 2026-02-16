---
endpoint: "GET /platform/v1/clients/{client_id}/payments"
domain: clients
tags: []
swagger: "swagger/clients/legacy/legacy_v1_clients.json"
status: verified
savedAt: "2026-01-25T09:12:43.655Z"
verifiedAt: "2026-01-25T09:12:43.655Z"
timesReused: 0
tokens: [directory]
---

# Get Payments

## Summary

Retrieves payments for a specific client. **Requires Directory token with X-On-Behalf-Of header.** Staff OAuth tokens fail with 422 "Unauthorized" due to authorization type mismatch in `PaymentsAPI.authorize_action` which requires `authorize_params[:type] == 'user'`.

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Payments retrieved |
| 201 | Success - Payments retrieved (alternate) |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - No access to client |
| 422 | Unauthorized - Staff token without proper authorization flow |

## Prerequisites

```yaml
steps:
  - id: get_client
    description: "Fetch a client from the business"
    method: GET
    token: directory
    path: "/platform/v1/clients"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_id: "$.data.clients[0].id"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_payments
    description: "Get payments for the client using directory token"
    method: GET
    path: "/platform/v1/clients/{{client_id}}/payments"
    token: directory
    headers:
      X-On-Behalf-Of: "{{business_id}}"
    expect:
      status: [200, 201]
```

## Critical Learnings

1. **Staff tokens fail despite having permissions** - The authorization logic in `PaymentsAPI.authorize_action` requires `authorize_params[:type] == 'user'`, which Staff OAuth tokens don't satisfy directly.
2. **Directory tokens with X-On-Behalf-Of work** - When a Directory token with `X-On-Behalf-Of` header is used, the authentication flow converts it to `type: 'user'` with the business owner user, satisfying the authorization check.
3. **Use Directory token pattern for payment-related endpoints** - This is the reliable authentication pattern for endpoints using `PaymentsAPI` authorization.

## Notes

- The `client_id` parameter must be a valid client that the token has access to
- For Directory tokens, `X-On-Behalf-Of` header with business UID is required (the workflow runner adds it automatically for `token: directory`)
- Returns 201 on success (not 200) - this is a legacy behavior
