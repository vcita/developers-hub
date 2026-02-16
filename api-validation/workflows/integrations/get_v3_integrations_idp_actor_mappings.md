---
endpoint: "GET /v3/integrations/idp_actor_mappings"
domain: integrations
tags: [integrations, idp]
swagger: swagger/integrations/integrations.json
status: verified
savedAt: 2026-02-09T20:19:00.000Z
verifiedAt: 2026-02-09T20:19:00.000Z
timesReused: 0
---

# List IDP Actor Mappings

## Summary
Retrieves all Identity Provider actor mappings for the directory. **Token Type**: Requires a **directory token**.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    method: GET
    path: "/v3/integrations/idp_actor_mappings"
    expect:
      status: 200
```