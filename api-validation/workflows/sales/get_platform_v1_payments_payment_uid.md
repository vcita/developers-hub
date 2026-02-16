---
endpoint: "GET /platform/v1/payments/{payment_uid}"
domain: sales
tags: []
swagger: /Users/ram.almog/Documents/GitHub/developers-hub/mcp_swagger/sales.json
status: success
savedAt: 2026-02-06T19:08:15.315Z
verifiedAt: 2026-02-06T19:08:15.315Z
timesReused: 0
useFallbackApi: true
---
# Get Payments

## Summary

GET /platform/v1/payments/{payment_uid} works (returns 201 + {status:'OK', data:{payment:{...}}}) once a real payment_uid exists. Resolved by creating a payment via POST /platform/v1/payments (payment_method must be one of allowed values like 'Cash'). Also discovered primary base URL (/apigw) returns 422 Unauthorized for this endpoint, while fallback (/api2) succeeds.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Get payments"
    method: GET
    path: "/platform/v1/payments/{{resolved.uid}}"
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| validation_rule: success_status_code | 200 (implied) | 201 on success | - |
| required_field: payment_uid_path_param_name | payment_uid | params[:id] (spec calls it payment_id) | - |
| missing_field: authentication_model | Staff token | OAuth token (Application & Application User) per spec + current_user.staff required | - |
| missing_field: business_uid_source | not specified | derived from current_user.staff.business.uid | - |
| enum_values: response_shape | payment object | wrapped response | - |
