---
endpoint: "PUT /business/payments/v1/client_packages/{uid}"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T22:21:05.741Z"
verifiedAt: "2026-01-26T22:21:05.741Z"
timesReused: 0
---

# Update Client packages

## Summary
Test passes. Successfully updated client package after resolving UID and using existing booking_credits structure.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_client_packages
    method: PUT
    path: "/business/payments/v1/client_packages/{{uid}}"
    body:
      client_package:
        booking_credits:
          "0":
            id: "{{id}}"
            total_bookings: 1
        valid_until: 2029-01-26
    expect:
      status: [200, 201]
```
