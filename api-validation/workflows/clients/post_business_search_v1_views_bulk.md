---
endpoint: "POST /business/search/v1/views/bulk"
domain: clients
tags: []
swagger: swagger/clients/legacy/crm_views.json
status: success
savedAt: 2026-01-26T05:12:03.933Z
verifiedAt: 2026-01-26T05:12:03.933Z
---

# Create Bulk

## Summary
Test passes successfully. The original request used placeholder UIDs that don't exist. When using valid view UIDs from existing views, the bulk update endpoint works correctly and returns HTTP 201 with updated view data.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_bulk
    method: POST
    path: "/business/search/v1/views/bulk"
    body:
      views:
        "0":
          uid: "{{view_uid_1}}"
          pinned: true
          order: 1
        "1":
          uid: "{{view_uid_2}}"
          pinned: false
          order: 2
          name: Updated Name
    expect:
      status: [200, 201]
```
