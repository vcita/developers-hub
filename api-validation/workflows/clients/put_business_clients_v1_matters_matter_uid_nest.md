---
endpoint: "PUT /business/clients/v1/matters/{matter_uid}/nest"
domain: clients
tags: []
swagger: swagger/clients/legacy/manage_clients.json
status: success
savedAt: 2026-01-26T05:32:51.457Z
verifiedAt: 2026-01-26T05:32:51.457Z
---

# Update Nest

## Summary
Successfully nested matter under another contact person. The endpoint required a contact_uid in the request body, which was resolved by fetching existing clients from GET /platform/v1/clients.

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
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: put_nest
    method: PUT
    path: "/business/clients/v1/matters/{matter_uid}/nest"
    body:
      contact_uid: "{{contact_uid}}"
    expect:
      status: [200, 201]
```
