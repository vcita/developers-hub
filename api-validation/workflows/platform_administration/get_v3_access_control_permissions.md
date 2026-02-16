---
endpoint: "GET /v3/access_control/permissions"
domain: platform_administration
tags: [access_control, permissions]
swagger: /Users/ram.almog/Documents/GitHub/developers-hub/mcp_swagger/platform_administration.json
status: verified
savedAt: 2026-01-27T14:13:42.789Z
verifiedAt: 2026-01-27T14:13:42.789Z
timesReused: 0
---

# Get Permissions List

## Summary
Retrieves a list of all available permissions in the access control system. **Token Type**: Requires a **staff token**.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    method: GET
    path: "/v3/access_control/permissions"
    expect:
      status: 200
```