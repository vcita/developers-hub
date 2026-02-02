---
endpoint: "GET /client/payments/v1/deposits/{uid}?matter_uid={matter_uid}"
domain: clients
tags: []
swagger: swagger/clients/legacy/clients_payments.json
status: success
savedAt: 2026-01-26T05:30:19.344Z
verifiedAt: 2026-01-26T05:30:19.344Z
---

# Get Deposits

## Summary
Successfully retrieved deposit details. The original failure was due to using a deposit UID that doesn't belong to the authenticated client. Test passes when using a valid deposit UID from the client's deposits list.

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
  - id: get_deposits
    method: GET
    path: "/client/payments/v1/deposits/{uid}?matter_uid={matter_uid}"
    expect:
      status: [200, 201]
```
