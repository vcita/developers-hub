---
endpoint: "GET /business/clients/v1/matters/{uid}"
domain: clients
tags: []
swagger: /Users/ram.almog/Documents/GitHub/developers-hub/mcp_swagger/clients.json
status: success
savedAt: 2026-02-06T14:32:43.368Z
verifiedAt: 2026-02-06T14:32:43.368Z
timesReused: 0
---
# Get Matters

## Summary

GET /business/clients/v1/matters/{uid} works. Initial 422 was due to using a non-existent matter UID. Resolved a valid matter UID via GET /business/clients/v1/contacts/{client_uid}/matters, then GET /business/clients/v1/matters/{uid} returned 200.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Get matters"
    method: GET
    path: "/business/clients/v1/matters/{{resolved.uid}}"
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| validation_rule: uid | (Unclear) likely documented as 404 Not Found when matter doesn't exist | Returns 422 with {success:false, errors:[{code:'invalid', message:"This matter doesn't exist"}] } when uid not found for business | - |
