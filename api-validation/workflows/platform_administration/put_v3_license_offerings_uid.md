---
endpoint: "PUT /v3/license/offerings/{uid}"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/license.json"
status: verified
savedAt: "2026-01-28T14:34:52.149Z"
verifiedAt: "2026-01-28T14:34:52.149Z"
timesReused: 0
---

# Update Offerings

## Summary
PUT /v3/license/offerings/{uid} endpoint tested successfully. Found documentation issues with authentication requirements and reporting_tags enum values.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_offerings
    method: PUT
    path: "/v3/license/offerings/{{uid}}"
    body:
      display_name: Professional License Package
      prices:
        "0":
          price: 99.99
          currency: USD
      trial: 14
      is_active: true
      reporting_tags:
        "0": business_management
        "1": free
      purchase_state: active
    expect:
      status: [200, 201]
```
