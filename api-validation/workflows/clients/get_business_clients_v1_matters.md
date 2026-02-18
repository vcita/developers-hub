---
endpoint: "GET /business/clients/v1/matters"
domain: clients
tags: []
swagger: /Users/ram.almog/Documents/GitHub/developers-hub/mcp_swagger/clients.json
status: success
savedAt: 2026-02-06T09:28:34.257Z
verifiedAt: 2026-02-06T09:28:34.257Z
timesReused: 0
---
# Get Matters

## Summary

GET /business/clients/v1/matters requires **contact_uid** (or an advanced filter) to avoid 500. The controller uses `MattersAPI.get(contact_uid: params[:contact_uid])`; without it the call can fail. **contact_uid** is the same as **client_uid** (contact/client UID). When this endpoint is used as a prerequisite step, callers must pass `contact_uid: "{{client_uid}}"` (from config.params.client_uid or from a prior step such as GET /platform/v1/clients). Alternatively, `filter[advanced][start_with]=a` works.

## Prerequisites

None required for this endpoint. Callers (e.g. workflows that use GET matters as a step) must supply **contact_uid** in params, or the request may 500.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Get matters (contact_uid or filter required to avoid 500)"
    method: GET
    path: "/business/clients/v1/matters"
    params:
      "filter[advanced][start_with]": "a"
      per_page: 25
    expect:
      status: [200, 201]
```

**When used as a prerequisite step**: Pass **contact_uid** (same as client_uid) in params so GET matters succeeds. Get client_uid from `config.params.client_uid` or from a prior step (e.g. GET /platform/v1/clients, extract `$.data.clients[0].uid`). This workflow's standalone test uses `filter[advanced][start_with]=a` so it does not require client_uid in config.

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| required_field: contact_uid | Swagger description says filter is required; without it returns 422 | If filter missing, controller falls back to MattersAPI.get(contact_uid: params[:contact_uid]); missing contact_uid can cause 500 | - |
