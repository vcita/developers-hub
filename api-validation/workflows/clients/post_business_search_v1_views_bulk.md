---
endpoint: "POST /business/search/v1/views/bulk"
domain: clients
tags: []
swagger: "swagger/clients/legacy/manage_clients.json"
status: verified
savedAt: "2026-02-03T22:00:00.000Z"
verifiedAt: "2026-02-03T22:00:00.000Z"
timesReused: 0
useFallbackApi: true
---

# Bulk Update Views

## Summary
Bulk update views endpoint. Requires a valid view UID from GET /business/search/v1/views. The primary gateway (/apigw) intermittently returns 404 Bad Gateway; fallback (/api2) works.

## Prerequisites

```yaml
steps:
  - id: create_view
    description: "Create a test view to get a valid UID"
    method: POST
    path: "/business/search/v1/views"
    token: staff
    body:
      view:
        name: "Test View for Bulk Update"
        description: "Temporary test view"
        view_type: "client"
        level: "staff"
        columns: [{"label": "Test", "type": "ContactFullName", "identifier": "contact_full_name", "sortable": true, "sort_options": {}}]
        sorting_column: "contact_full_name"
        sorting_direction: "asc"
        filter: "{}"
    expect:
      status: [200, 201]
    extract:
      view_uid: "$.data.uid"
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: bulk_update_views
    method: POST
    path: "/business/search/v1/views/bulk"
    body:
      views: [{"uid": "{{view_uid}}", "pinned": true, "order": 2}]
    expect:
      status: [200, 201]
```

## Critical Learnings

- **views[].uid is required**: Each view item must have a valid UID that exists in the business
- **filter must be JSON string**: If updating filter, it must be a JSON-encoded string like `"{}"`, not a JSON object
- **Primary gateway unreliable**: Use fallback URL (/api2) as primary gateway returns Bad Gateway for this endpoint
