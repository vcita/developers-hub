---
endpoint: "POST /business/search/v1/views"
domain: clients
tags: []
swagger: "swagger/clients/legacy/crm_views.json"
status: verified
savedAt: "2026-01-25T19:26:45.697Z"
verifiedAt: "2026-01-25T19:26:45.697Z"
timesReused: 0
---

# Create Search

## Summary
Successfully created a view by using correct level value. The test was failing because 'business' is not a valid level - only 'staff' and 'account' are valid.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_views
    method: POST
    path: "/business/search/v1/views"
    body:
      view:
        level: staff
        view_type: client
        columns: [{"label": "Test Label", "type": "ContactFullName", "identifier": "contact_full_name", "sortable": true, "sort_options": {}}]
        sorting_column: contact_full_name
        sorting_direction: asc
        filter: "{}"
        name: Test View
        description: Test Description
        order: 1
    expect:
      status: [200, 201]
```
