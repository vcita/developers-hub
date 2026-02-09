---
endpoint: "POST /platform/v1/clients"
domain: clients
tags: [clients, platform]
swagger: "swagger/clients/legacy/legacy_v1_clients.json"
status: pending
savedAt: "2026-02-06T07:54:47.523Z"
verifiedAt: "2026-02-06T07:54:47.523Z"
timesReused: 0
---

# Create Client

## Summary

Creates a new client for the business. The API requires `first_name` (presence validation); omitting it returns 422 "First name can't be blank".

**Token Type**: This endpoint requires a **Staff or Directory token**.

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Client retrieved/updated |
| 201 | Success - Client created |
| 401 | Unauthorized - Invalid or missing token |
| 422 | Unprocessable Entity - Validation failed (e.g. first_name blank) |

## Prerequisites

None required for this endpoint. Use `{{business_id}}` from config for context when needed.

## Test Request

```yaml
steps:
  - id: create_client
    description: "Create a client with required first_name"
    method: POST
    path: "/platform/v1/clients"
    body:
      first_name: "API"
      last_name: "Test"
      email: "{{random_email}}"
      phone: "{{random_phone}}"
    expect:
      status: [200, 201]
```

## Notes

- `first_name` is required by the API; swagger should mark it in the request schema required array.
- API also accepts optional `utm_params` and `opt_in` (or `opt_in_transactional_sms`); see swagger for full request shape.
