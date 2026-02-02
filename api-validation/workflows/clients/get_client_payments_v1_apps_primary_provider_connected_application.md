---
endpoint: "GET /client/payments/v1/apps/primary_provider_connected_application"
domain: clients
tags: [apps]
swagger: swagger/clients/legacy/clients_payments.json
status: skip
savedAt: 2026-01-25T21:12:26.168Z
verifiedAt: 2026-01-25T21:12:26.168Z
---

# Get Primary provider connected application

## Summary
User-approved skip: This endpoint requires complex payment app configuration including business settings (external_[app_name]_connected=true, payments_gateway_type matching, not in pending mode, and for vcitaPayments: accepted terms). These are business configuration requirements that cannot be easily automated in a test environment without administrative access to business payment settings.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_primary_provider_connected_application
    method: GET
    path: "/client/payments/v1/apps/primary_provider_connected_application"
    expect:
      status: [200, 201]
```
