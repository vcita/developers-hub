---
endpoint: "GET /platform/v1/clients/{client_id}/payment/cards"
domain: sales
tags: [cards, payments]
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: pending
savedAt: 2026-02-06T20:49:00.000Z
verifiedAt: 2026-02-07T07:34:04.000Z
timesReused: 0
useFallbackApi: true
tokens: [directory]
---
# List Client Payment Cards

## Summary

Lists payment cards for a specific client. Requires a **directory token** with `X-On-Behalf-Of` header. Staff tokens return 422 Unauthorized.

**Token Type**: This endpoint requires a **Directory token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint.

## Authentication

| Token Type | Works | Notes |
|------------|-------|-------|
| Staff | ❌ | Returns 422 with error_code=unauthorized |
| Directory | ✅ | Requires X-On-Behalf-Of header |

## Prerequisites

```yaml
steps:
  - id: get_client_id
    description: "Fetch a client ID for the business"
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
    description: "List payment cards for a client"
    method: GET
    path: "/platform/v1/clients/{{client_id}}/payment/cards"
    token: directory
    expect:
      status: [200]
```
