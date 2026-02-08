---
endpoint: "PUT /business/payments/v1/tax_bulk"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: pending
savedAt: 2026-02-06T20:12:16.238Z
verifiedAt: 2026-02-07T07:26:51.000Z
timesReused: 0
useFallbackApi: true
---
# Update Tax bulk

## Summary

PUT /business/payments/v1/tax_bulk succeeds when each tax object includes its existing tax id. Original 422 'Tax not found' was caused by missing id (returned as field tax_id). Also note: GET /business/payments/v1/taxes returned 401 on primary apigw URL but worked on fallback api2 URL; retry succeeded on fallback.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint.

## Prerequisites

```yaml
steps:
  - id: get_tax_id
    description: "Fetch a tax ID to update"
    method: GET
    path: "/business/payments/v1/taxes"
    token: staff
    extract:
      tax_id: "$.data.taxes[0].id"
      tax_name: "$.data.taxes[0].name"
      tax_rate: "$.data.taxes[0].rate"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    description: "Update tax_bulk"
    method: PUT
    path: "/business/payments/v1/tax_bulk"
    body:
      data: [{"id":"{{tax_id}}","name":"API Test Tax {{now_timestamp}}","rate":8.77}]
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| required_field: data[*].id | Not present/required in update schema | Required for update; spec passes id and API errors with field tax_id when missing | - |
