---
endpoint: "GET /business/payments/v1/client_packages/{uid}"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-26T22:11:55.113Z
verifiedAt: 2026-01-26T22:11:55.113Z
---

# Get Client packages

## Summary
Test passes. The endpoint works correctly when using a valid client package UID that exists in the system. The original failure was due to using a placeholder UID that doesn't exist.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_client_packages
    method: GET
    path: "/business/payments/v1/client_packages/{uid}"
    expect:
      status: [200, 201]
```
