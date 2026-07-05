---
endpoint: "POST /business/payments/v1/payment_requests/{payment_request_id}/send_link"
domain: sales
tags: []
status: success
savedAt: 2026-01-26T21:29:31.220Z
verifiedAt: 2026-01-26T21:29:31.220Z
---

# Create Send link

## Summary
Test passes with valid channel value. The 'channel' parameter must be either 'email' or 'sms', not 'test_string'.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_send_link
    method: POST
    path: "/business/payments/v1/payment_requests/{payment_request_id}/send_link"
    body:
      channel: email
    expect:
      status: [200, 201]
```
