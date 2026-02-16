---
endpoint: "GET /business/payments/v1/estimates/{estimate_uid}"
domain: sales
tags: [estimates]
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-02-08T16:32:45.000Z"
verifiedAt: "2026-02-08T16:32:45.000Z"
timesReused: 0
tokens: [staff]
useFallbackApi: true
---

# Get Estimate

## Summary

Retrieves an estimate by UID. This endpoint requires **staff token** and must use the fallback API due to API gateway routing issues.

**Token Type**: This endpoint requires a **Staff token**.

> **Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway returns 401 for tokens on `/business/payments/v1/*` paths.

## Prerequisites

```yaml
steps:
  - id: get_client_uid
    description: "Fetch a valid client UID for this business"
    method: GET
    path: "/platform/v1/clients"
    token: staff
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_uid: "$.data.clients[0].id"
    expect:
      status: [200]
    onFail: abort

  - id: get_matter_uid
    description: "Fetch a matter UID for the configured client"
    method: GET
    path: "/business/clients/v1/contacts/{{client_uid}}/matters"
    token: staff
    extract:
      matter_uid: "$.data.matters[0].uid"
    expect:
      status: [200]
    onFail: abort

  - id: create_estimate
    description: "Create an estimate to retrieve"
    method: POST
    path: "/business/payments/v1/estimates"
    token: staff
    useFallbackApi: true
    body:
      estimate:
        matter_uid: "{{matter_uid}}"
        issue_date: "{{today_date}}"
        due_date: "{{next_month_date}}"
        currency: "USD"
        billing_address: "123 Main St, San Francisco, CA"
        items:
          - name: "Legal Consultation"
            quantity: 1
            unit_amount: 100
            item_index: 0
    extract:
      estimate_uid: "$.data.estimate.uid"
    expect:
      status: [201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_estimate
    description: "Get the created estimate by UID"
    method: GET
    path: "/business/payments/v1/estimates/{{estimate_uid}}"
    token: staff
    useFallbackApi: true
    expect:
      status: [200]
```