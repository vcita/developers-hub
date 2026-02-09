---
endpoint: "POST /business/payments/v1/card_requests"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-26T21:20:10.231Z
verifiedAt: 2026-01-26T21:20:10.231Z
---

# Create Card requests

## Summary
Test passes after fixing channel parameter. The API only accepts 'email' or 'sms' as valid channel values, not 'test_string'.

## Prerequisites

No prerequisites required for this endpoint.

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
