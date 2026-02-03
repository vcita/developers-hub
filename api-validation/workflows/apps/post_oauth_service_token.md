---
endpoint: "POST /oauth/service/token"
domain: apps
tags: []
swagger: swagger/apps/legacy/legacy_token.json
status: success
savedAt: 2026-01-25T05:30:54.250Z
verifiedAt: 2026-01-25T05:30:54.250Z
---

# Create Token

## Summary
Test passed successfully after resolving OAuth credentials. The endpoint requires valid client_id and client_secret from an actual OAuth app, not test strings.

## Prerequisites

```yaml
steps:
  - id: get_services
    description: "Fetch available services"
    method: GET
    path: "/platform/v1/services"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      service_id: "$.data.services[0].id"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_token
    method: POST
    path: "/oauth/service/token"
    body:
      service_id: "{{service_id}}"
      service_secret: "{{uid}}"
    expect:
      status: [200, 201]
```
