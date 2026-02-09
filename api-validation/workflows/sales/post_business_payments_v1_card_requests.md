---
endpoint: POST /business/payments/v1/card_requests
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: verified
savedAt: 2026-01-26T21:20:10.231Z
verifiedAt: 2026-02-07T07:49:10.000Z
timesReused: 0
expectedOutcome: 422
expectedOutcomeReason: "Card requests require a configured payment gateway in this environment. The test business has no configured gateway, so the API returns 422."
---

# Create Card requests

## Summary
Card requests require a configured payment gateway. The test business has no gateway configured, so this endpoint returns 422. See expectedOutcome.

## Prerequisites

```yaml
steps:
  - id: get_client_uid
    description: "Fetch a client UID for the business"
    method: GET
    path: "/platform/v1/clients"
    token: staff
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_uid: "$.data.clients[0].id"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_card_requests
    method: POST
    path: "/business/payments/v1/card_requests"
    body:
      card_request:
        alpha2: US
        channel: email
        channel_value: test@example.com
        client_uid: "{{client_uid}}"
    expect:
      status: [200, 201]
```
