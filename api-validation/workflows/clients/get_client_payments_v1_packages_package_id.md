---
endpoint: "GET /client/payments/v1/packages/{package_id}"
domain: clients
tags: [packages, payments]
swagger: "swagger/clients/legacy/clients_payments.json"
status: verified
savedAt: "2026-02-02T21:05:24.642Z"
verifiedAt: "2026-02-04T16:30:30.000Z"
timesReused: 0
expectedOutcome: [200]
expectedOutcomeReason: "200 when package exists and client token is valid."
---

# Get Package Details

## Summary

Retrieves details for a specific booking package. The client show endpoint only requires the package to be `active: true` — it does NOT filter by `online_payment_enabled` (unlike the client list endpoint). The `business_id` query parameter is NOT required for the show endpoint; the controller resolves the business from the package itself.

**Token Type**: This endpoint requires a **Client token**.

**Expected Outcome**: 200 when a valid package_id is provided.

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Package details returned |
| 401 | Unauthorized - Client token is invalid or expired |
| 422 | Not Found - Package doesn't exist or is inactive |

## Prerequisites

```yaml
steps:
  - id: get_packages_list
    description: "Get list of packages to find a valid package ID. The client list endpoint only returns packages with online_payment_enabled=true."
    method: GET
    path: "/client/payments/v1/packages"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    token: client
    extract:
      package_id: "$.data.packages[0].id"
    expect:
      status: [200]
    onFail: abort
```

## UID Resolution Procedure

| UID Field | Source Endpoint | Extract Path | Notes |
|-----------|-----------------|--------------|-------|
| package_id | GET /client/payments/v1/packages | $.data.packages[0].id | Returns packages with online_payment_enabled=true |

### Resolution Steps

**package_id**:
1. Call `GET /client/payments/v1/packages?business_id={{business_id}}&per_page=1` with **client token**
2. Extract `$.data.packages[0].id` from response
3. Note: Response uses `id` field, not `uid`

## Test Request

```yaml
steps:
  - id: get_package
    description: "Get package details by ID using client token. No business_id needed for show endpoint."
    method: GET
    path: "/client/payments/v1/packages/{{package_id}}"
    token: client
    expect:
      status: [200]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| Path param | `{package_id}` | Route uses `{uid}` via `param: :uid` | Controller: `params[:uid]` |
| business_id | Not documented as query param | Not required for show endpoint | Controller passes `business_uid: nil` |

## Parameters Reference

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| package_id | string | Yes | Package unique identifier (the `id` field from package responses) |

## Known Issues

### Client List vs Show Filtering

The client list endpoint (`GET /client/payments/v1/packages`) only returns packages where `online_payment_enabled=true`. The show endpoint only checks `active: true`. This means packages can be accessible via show but invisible in the list.

### business_id Not Required for Show

Unlike the list endpoint which requires `business_id`, the show endpoint does NOT need it. The controller passes `business_uid: nil` and the package is looked up directly by its uid. The client-portal frontend confirms this pattern: `baseApiService.get('/client/payments/v1/packages/${package_uid}', {})`.

## Critical Learnings

1. **No business_id needed for show** - The show endpoint doesn't require `business_id` (confirmed by controller and client-portal code)
2. **Show only checks active** - The show endpoint only requires `active: true`, not `online_payment_enabled: true`
3. **Response uses id** - The package identifier in responses is `id`, not `uid`
4. **online_payment_enabled filter** - The client list endpoint requires business to have packages with `online_payment_enabled=true` to return results
