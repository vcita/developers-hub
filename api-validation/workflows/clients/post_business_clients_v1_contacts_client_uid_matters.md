---
endpoint: "POST /business/clients/v1/contacts/{client_uid}/matters"
domain: clients
tags: []
swagger: swagger/clients/legacy/manage_clients.json
status: success
savedAt: 2026-01-26T05:14:49.775Z
verifiedAt: 2026-01-26T05:14:49.775Z
---

# Create Matters

## Summary
Matter creation succeeded after using correct field UID and valid name value. The original request failed because: 1) It used an incorrect field UID (02tnghfvvfgqv1ib instead of wrytui9q48as6ovw for the name field), 2) The value "test_string" may not meet validation requirements.

## Prerequisites

```yaml
steps:
  - id: get_clients
    description: "Fetch available clients"
    method: GET
    path: "/platform/v1/clients"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_id: "$.data.clients[0].id"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_matters
    method: POST
    path: "/business/clients/v1/contacts/{client_uid}/matters"
    body:
      matter:
        fields:
          "0":
            uid: "{{uid}}"
            value: New Matter Name
        note: test_string
        tags:
          "0": test_string
    expect:
      status: [200, 201]
```
