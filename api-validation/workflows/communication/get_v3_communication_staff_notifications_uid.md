---
endpoint: "GET /v3/communication/staff_notifications/{uid}"
domain: communication
tags: []
swagger: "swagger/communication/staff_notification.json"
status: verified
savedAt: "2026-01-27T05:46:41.277Z"
verifiedAt: "2026-01-27T05:46:41.277Z"
timesReused: 0
---

# Get Staff notifications

## Summary
Test passes after resolving authentication and UID issues. Used directory token and created a valid staff notification to test retrieval.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_staff_notifications
    method: GET
    path: "/v3/communication/staff_notifications/{{uid}}"
    expect:
      status: [200, 201]
```
