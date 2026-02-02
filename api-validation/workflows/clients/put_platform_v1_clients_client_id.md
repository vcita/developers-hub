---
endpoint: "PUT /platform/v1/clients/{client_id}"
domain: clients
tags: []
swagger: swagger/clients/legacy/legacy_v1_clients.json
status: success
savedAt: 2026-01-26T05:35:08.437Z
verifiedAt: 2026-01-26T05:35:08.437Z
---

# Update Clients

## Summary
Successfully updated client after creating a fresh test client. The original error was due to an email uniqueness constraint violation.

## Prerequisites

```yaml
steps:
  - id: get_clients
    description: "Fetch available clients"
    method: GET
    path: "/platform/v1/clients"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_id: "$.data.clients[0].id"
    expect:
      status: 200
    onFail: abort
  - id: get_staffs
    description: "Fetch available staff members"
    method: GET
    path: "/platform/v1/businesses/{{business_id}}/staffs"
    params:
      per_page: "1"
    extract:
      staff_id: "$.data.staffs[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: put_clients
    method: PUT
    path: "/platform/v1/clients/{client_id}"
    body:
      address: 123 Test Street, Test City, TC 12345
      custom_field1: Test Custom Field 1
      custom_field2: Test Custom Field 2
      custom_field3: Test Custom Field 3
      email: updated-testclient123456@example.com
      first_name: Updated
      force_nullifying: false
      last_name: Client
      mobile_phone: +1-555-123-4567
      phone: +1-555-987-6543
      spam: false
      staff_id: "{{staff_id}}"
      status: lead
      tags: updated, test
    expect:
      status: [200, 201]
```
