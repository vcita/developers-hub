---
endpoint: "GET /platform/v1/clients/payment/client_packages/validate"
domain: clients
tags: []
swagger: swagger/clients/legacy/legacy_v1_clients.json
status: success
savedAt: 2026-01-25T09:10:11.000Z
verifiedAt: 2026-01-25T09:10:11.000Z
---

# Get Client packages

## Summary
Successfully validated client package redemption. The endpoint required a payment_status_id query parameter that was missing from the original request. After providing the required parameter and using the client token for authentication, the endpoint returned a 200 response with the validation result.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_validate
    method: GET
    path: "/platform/v1/clients/payment/client_packages/validate"
    expect:
      status: [200, 201]
```
