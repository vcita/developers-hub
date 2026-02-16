---
endpoint: "GET /platform/v1/directory/branding"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/legacy/legacy_v1_platform.json"
status: verified
savedAt: "2026-01-27T09:25:08.359Z"
verifiedAt: "2026-01-27T09:25:08.359Z"
timesReused: 0
---

# Get Branding

## Summary
Test passes with directory token. Returns HTTP 200 with directory branding data including UID, name, colors, logo, and powered_by information.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_branding
    method: GET
    path: "/platform/v1/directory/branding"
    expect:
      status: [200, 201]
```
