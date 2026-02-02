---
endpoint: "GET /client/payments/v1/packages/{package_id}"
domain: clients
tags: []
swagger: swagger/clients/legacy/clients_payments.json
status: success
savedAt: 2026-01-25T19:47:14.779Z
verifiedAt: 2026-01-25T19:47:14.779Z
---

# Get Packages

## Summary
Successfully retrieved package information using package_id "d6l0y9icbn5v34re" from created test package. The endpoint returned detailed package data including services and pricing information.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_packages
    method: GET
    path: "/client/payments/v1/packages/{package_id}"
    expect:
      status: [200, 201]
```
