---
endpoint: POST /platform/v1/leadgen
domain: sales
tags: []
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: verified
savedAt: 2026-02-06T17:44:10.180Z
verifiedAt: 2026-02-07T08:01:08.000Z
timesReused: 0
---
# Create Leadgen

## Summary

POST /platform/v1/leadgen succeeded (201) after adding required identifier field. When identifier_type=email, request must include email. Sent body with business_id, identifier_type=email, email, first_name, request_title → 201 Created.

## Prerequisites

```yaml
steps:
  - id: get_client_id
    description: "Fetch a client ID for date variable initialization"
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
    description: "Create leadgen"
    method: POST
    path: "/platform/v1/leadgen"
    token: staff
    body:
      business_id: "{{business_id}}"
      identifier_type: "email"
      email: "john.leadgen.test+{{now_timestamp}}@example.com"
      first_name: "John"
      request_title: "Legal consultation request"
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| required_field: email | optional | required when identifier_type=email | - |
| required_field: unique_id | optional | required when identifier_type=unique_id | - |
| required_field: business_id | not required | business_uid missing causes error; controller derives from staff token or directory on-behalf-of, else must be provided | - |
