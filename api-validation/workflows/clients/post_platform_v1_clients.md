---
endpoint: "POST /platform/v1/clients"
domain: clients
tags: []
swagger: swagger/clients/legacy/legacy_v1_clients.json
status: success
savedAt: 2026-01-26T05:16:50.249Z
verifiedAt: 2026-01-26T05:16:50.249Z
---

# Create Clients

## Summary
Successfully created client after resolving staff_id validation and uniqueness constraint. Used staff_uid instead of staff_id and unique email address.

## Prerequisites

```yaml
steps:
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
  - id: post_clients
    method: POST
    path: "/platform/v1/clients"
    body:
      address: 123 Test Street
      custom_field1: test_value_1
      custom_field2: test_value_2
      custom_field3: test_value_3
      email: test{{timestamp}}@example.com
      first_name: John
      last_name: Doe
      opt_in_transactional_sms: true
      phone: "+1234567890"
      source_campaign: test_campaign
      source_channel: test_channel
      source_name: test_source
      source_url: https://test.example.com
      staff_id: "{{staff_id}}"
      status: lead
      tags: test_tag
    expect:
      status: [200, 201]
```
