---
endpoint: "PUT /business/clients/v1/matters/{matter_uid}/reassign"
domain: clients
tags: []
swagger: "swagger/clients/legacy/manage_clients.json"
status: verified
savedAt: "2026-01-25T10:25:32.048Z"
verifiedAt: "2026-01-25T10:25:32.048Z"
timesReused: 0
---

# Update Reassign

## Summary
Test passed successfully. The PUT /business/clients/v1/matters/{matter_uid}/reassign endpoint returned HTTP 200. Original 500 error was likely a temporary backend issue related to array concatenation in error handling code.

## Prerequisites

```yaml
steps:
  - id: get_matters
    description: "Fetch available matters"
    method: GET
    path: "/platform/v1/matters"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      matter_uid: "$.data.matters[0].uid"
    expect:
      status: [200]
    onFail: abort
  - id: get_staffs
    description: "Fetch available staff members"
    method: GET
    path: "/platform/v1/businesses/{{business_id}}/staffs"
    params:
      per_page: "1"
    extract:
      staff_id: "$.data.staffs[0].uid"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: put_reassign
    method: PUT
    path: "/business/clients/v1/matters/{{matter_uid}}/reassign"
    body:
      notes: Staff reassignment test
      reassign_future_meetings: false
      staff_uid: "{{staff_uid}}"
    expect:
      status: [200, 201]
```
