---
endpoint: GET /platform/v1/services/{service_uid}
domain: sales
tags: []
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: verified
savedAt: 2026-02-06T19:12:33.880Z
verifiedAt: 2026-02-07T07:53:25.000Z
timesReused: 0
---
# Get Services

## Summary

PASS after resolving a valid service_uid via GET /platform/v1/services (requires business_id). Retried GET /platform/v1/services/{service_uid} with a real service UID and received 200 OK.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Get services"
    method: GET
    path: "/platform/v1/services/{{service_id}}"
    token: staff
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| missing_field: path param name | {service_uid} | params[:id] | - |
| validation_rule: extra_decorator_fields | Not documented | When extra_decorator_fields == "true" adds EXTRA_DECORATE_FIELDS | - |
| validation_rule: error handling | Not specified | Non-OK response => 422; RecordNotFound => 404; Exception => 500 | - |
