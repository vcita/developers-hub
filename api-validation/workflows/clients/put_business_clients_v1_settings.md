---
endpoint: "PUT /business/clients/v1/settings"
domain: clients
tags: []
swagger: "swagger/clients/legacy/manage_clients.json"
status: pending
savedAt: "2026-02-03T18:27:27.715Z"
timesReused: 0
---

# Update Settings

## Summary
Updates client settings. Requires settings object with terms configuration.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_settings
    method: PUT
    path: "/business/clients/v1/settings"
    body:
      settings:
        terms:
          selected: "clients"
    expect:
      status: [200, 201]
```
