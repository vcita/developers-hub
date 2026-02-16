---
endpoint: "POST /business/clients/v1/contacts/{client_uid}/matters"
domain: clients
tags: []
swagger: /Users/ram.almog/Documents/GitHub/developers-hub/mcp_swagger/clients.json
status: success
savedAt: 2026-02-06T16:59:17.174Z
verifiedAt: 2026-02-06T16:59:17.174Z
timesReused: 0
---
# Create Matters

## Summary

POST /business/clients/v1/contacts/{client_uid}/matters succeeded (201) after using a unique value for the required matter name field. Original 422 already_exists was due to duplicate name value for the matter name field UID.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Create matters"
    method: POST
    path: "/business/clients/v1/contacts/{{resolved.uid}}/matters"
    body:
      matter: {"fields":[{"uid":"{{resolved.uid}}","value":"Personal Injury Case - 2026-02-06T16:51:51.834Z"}]}
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| validation_rule: matter.fields (name field) | Name field requirement described, but uniqueness/duplicate error not documented | validate_matter runs before create and can reject duplicates with already_exists | - |
| missing_field: matter.tags | Not clear if tags array is expected | tags passed directly to MatterTagsApi.add_tags; treated as array | - |
