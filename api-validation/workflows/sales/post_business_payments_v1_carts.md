---
endpoint: "POST /business/payments/v1/carts"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: verified
savedAt: 2026-02-06T21:55:41.659Z
verifiedAt: 2026-02-07T07:02:15.000Z
timesReused: 0
---
# Create Carts

## Summary

Successfully created cart sale after discovering required entity_name field missing from swagger documentation. Code requires entity_name for catalog-type items to satisfy OrderItem name validation.

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
```

## UID Resolution Procedure

How to obtain required UIDs for this endpoint:

| UID Field | Source | Extract From | Notes |
|-----------|--------|--------------|-------|
| client_uid | GET /platform/v1/clients | $.data.clients[0].id | First client for business_id |
| entity_uid | config params | config.params.service_id | Service UID provided in test config |
| matter_uid | GET /business/clients/v1/contacts/{client_uid}/matters | $.data.matters[0].uid | Endpoint is routed via fallback API |

## Test Request

```yaml
steps:
  - id: main_request
    description: "Create carts"
    method: POST
    path: "/business/payments/v1/carts"
    body:
      cart: {"currency":"USD","items":[{"entity_uid":"{{service_id}}","entity_type":"Service","entity_name":"Introductory Phone Call","amount":50}],"matter_uid":"{{matter_uid}}"}
      is_sale: true
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| required_field: entity_name | not documented in cart.items schema | required for catalog item types (Service, Product, Package, Custom) | - |
| validation_rule: name | not documented | OrderItem validates :name, presence: true | - |
