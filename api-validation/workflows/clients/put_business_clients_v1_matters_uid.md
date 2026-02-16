---
endpoint: "PUT /business/clients/v1/matters/{uid}"
domain: clients
tags: [matters, update]
swagger: /Users/ram.almog/Documents/GitHub/developers-hub/mcp_swagger/clients.json
status: verified
savedAt: 2026-02-04T08:12:05.238Z
verifiedAt: 2026-02-04T16:10:00.000Z
timesReused: 0
---
# Update Matters

## Summary

PUT /business/clients/v1/matters/{uid} updates a matter's fields. Requires a valid matter UID from the business. The `{{matter_uid}}` is available from config (tokens.json) and points to a pre-existing matter for the test business.

**Token Type**: This endpoint requires a **Staff token**.

## Prerequisites

None required for this endpoint. The `{{matter_uid}}` is provided from config.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Update matter with empty fields array (validates endpoint accessibility)"
    method: PUT
    path: "/business/clients/v1/matters/{{matter_uid}}"
    body:
      matter:
        fields: []
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| validation_rule: uid (path) | Matter UID must exist and be accessible (documented). | Invalid/non-existent UID produces 422 invalid with message "This matter doesn't exist". | - |
| required_field: fields | Fields array is optional | Empty fields array is accepted and returns 200 | Tested with empty fields |

## Notes

- The `{{matter_uid}}` variable comes from config (tokens.json params section)
- The matter must belong to the business associated with the staff token
- Fields array can be empty; the endpoint validates matter exists and user has permission
- To update actual field values, get field UIDs from `GET /platform/v1/fields` (filter by `object_type=matter`)
