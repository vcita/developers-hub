---
endpoint: POST /platform/v1/payments
domain: sales
tags: []
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: verified
savedAt: 2026-01-26T21:58:21.948Z
verifiedAt: 2026-02-07T08:02:38.000Z
timesReused: 0
tokens: [directory]
---

# Create Payments

## Summary
Test passes with directory token and X-On-Behalf-Of header. Staff token returns 422 Unauthorized on APIGW. The API expects client_id field to contain the client UID, not the client ID hash.

**Token Type**: This endpoint requires a **Directory token**.

## Authentication

| Token Type | Works | Notes |
|------------|-------|-------|
| Staff | ❌ | Returns 422 Unauthorized |
| Directory | ✅ | Requires X-On-Behalf-Of header |

## Prerequisites

```yaml
steps:
  - id: get_clients
    description: "Fetch available clients"
    method: GET
    path: "/platform/v1/clients"
    token: staff
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_id: "$.data.clients[0].id"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    description: "Create a payment"
    method: POST
    path: "/platform/v1/payments?business_id={{business_id}}"
    token: directory
    body:
      client_id: "{{client_id}}"
      amount: 1
      currency: "USD"
      title: "Test"
      payment_method: "Cash"
      offline: true
      conversation_id: "{{matter_uid}}"
      staff_id: "{{staff_id}}"
    expect:
      status: [200, 201]
```
