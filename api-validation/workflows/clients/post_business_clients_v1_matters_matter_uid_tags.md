---
endpoint: "POST /business/clients/v1/matters/{matter_uid}/tags"
domain: clients
tags: []
swagger: swagger/clients/legacy/manage_clients.json
status: pending
---

# Create Tag

## Summary
Adds a tag to a matter. Requires a valid matter_uid and tag string.

## Prerequisites

```yaml
steps:
  - id: get_matters
    description: "Get a matter to add tag to"
    method: GET
    path: "/business/clients/v1/matters"
    extract:
      matter_uid: "$.data.matters[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_tags
    method: POST
    path: "/business/clients/v1/matters/{matter_uid}/tags"
    body:
      tag: "api-test-tag"
    expect:
      status: [200, 201]
```
