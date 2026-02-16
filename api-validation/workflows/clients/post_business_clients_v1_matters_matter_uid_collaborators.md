---
endpoint: "POST /business/clients/v1/matters/{matter_uid}/collaborators"
domain: clients
tags: [matters, collaborators]
swagger: "swagger/clients/legacy/manage_clients.json"
status: pending
savedAt: "2026-02-06T07:50:32.112Z"
verifiedAt: "2026-02-06T07:50:32.112Z"
timesReused: 0
---

# Add Matter Collaborator

## Summary

Adds a staff member as a collaborator to a matter. The request body must include `collaborator` with `staff_uid`; missing or empty body causes 500 NoMethodError.

**Token Type**: This endpoint requires a **Staff token**.

## Response Codes

| Status | Meaning |
|--------|---------|
| 201 | Success - Collaborator added |
| 401 | Unauthorized - Invalid or missing token |
| 404 | Not Found - Matter or staff not found |
| 422 | Unprocessable Entity - Validation failed (e.g. missing collaborator or staff_uid) |
| 500 | Internal Server Error - Occurs when request body is missing collaborator object |

## Prerequisites

```yaml
steps:
  - id: get_matters
    description: "Get a matter to add collaborator to"
    method: GET
    path: "/business/clients/v1/matters"
    params:
      per_page: 1
    extract:
      matter_uid: "$.data.matters[0].uid"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_collaborator
    description: "Add staff as collaborator to the matter"
    method: POST
    path: "/business/clients/v1/matters/{{matter_uid}}/collaborators"
    body:
      collaborator:
        staff_uid: "{{staff_uid}}"
    expect:
      status: [200, 201]
```

## UID Resolution Procedure

| UID Field | Source Endpoint | Extract Path | Notes |
|-----------|-----------------|--------------|-------|
| matter_uid | GET /business/clients/v1/matters | $.data.matters[0].uid | Use first available matter |
| staff_uid | config.params | staff_uid | From tokens.json params |

## Notes

- Body must include `collaborator` object with `staff_uid`. Swagger should document these as required.
