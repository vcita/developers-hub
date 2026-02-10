---
endpoint: "POST /v3/integrations/idp_actor_mappings"
domain: integrations
tags: [integrations, idp]
swagger: swagger/integrations/integrations.json
status: verified
savedAt: 2026-01-26T21:35:00.000Z
verifiedAt: 2026-01-26T21:35:00.000Z
timesReused: 0
---

# Create IDP Actor Mapping

## Summary
Creates a mapping between an Identity Provider user and an internal staff actor. **Token Type**: Requires a **directory token**.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    method: POST
    path: "/v3/integrations/idp_actor_mappings"
    body:
      actor_uid: "{{staff_id}}"
      idp_user_reference_id: "test_idp_reference_123"
      actor_type: "staff"
    expect:
      status: [200, 201]
```