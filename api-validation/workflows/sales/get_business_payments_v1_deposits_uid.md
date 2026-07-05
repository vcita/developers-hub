---
endpoint: "GET /business/payments/v1/deposits/{uid}"
domain: sales
tags: [deposits]
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: 2026-02-08T21:28:12.398Z
verifiedAt: 2026-02-08T21:28:12.398Z
timesReused: 0
tokens: [staff]
---

# Get Deposit

## Summary

Retrieves a specific deposit by UID. This endpoint requires a **staff token**.

**Token Type**: This endpoint requires a **Staff token**.

## Prerequisites

```yaml
steps:
  - id: get_deposit_uid
    description: "Fetch an existing deposit UID"
    method: GET
    path: "/business/payments/v1/deposits"
    token: staff
    params:
      per_page: "1"
    extract:
      deposit_uid: "$.data.deposits[0].uid"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_deposit
    description: "Get the specific deposit by UID"
    method: GET
    path: "/business/payments/v1/deposits/{{deposit_uid}}"
    token: staff
    expect:
      status: [200]
```

## Parameters Reference

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| uid | string | Yes | Deposit unique identifier |

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Deposit retrieved |
| 401 | Unauthorized - Invalid token |
| 404 | Not Found - Deposit doesn't exist |