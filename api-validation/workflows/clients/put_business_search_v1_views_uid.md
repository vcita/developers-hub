---
endpoint: "PUT /business/search/v1/views/{uid}"
domain: clients
tags: []
swagger: swagger/clients/legacy/crm_views.json
status: success
savedAt: 2026-01-26T05:32:22.049Z
verifiedAt: 2026-01-26T05:32:22.049Z
---

# Update Search

## Summary
Successfully updated view after correcting level value from "business" to "account" and providing proper JSON format for filter field

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_views
    method: PUT
    path: "/business/search/v1/views/{uid}"
    body:
      view:
        level: account
        name: Updated Test View
        columns:
          "0":
            label: Contact Name
            type: ContactFullName
            identifier: contact_full_name
            sortable: true
            sort_options: {}
          "1":
            label: Tags
            type: Tags
            identifier: tags
            sortable: false
            sort_options: {}
        filter: "{}"
    expect:
      status: [200, 201]
```
