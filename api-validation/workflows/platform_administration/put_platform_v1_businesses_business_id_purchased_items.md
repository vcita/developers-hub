---
endpoint: "PUT /platform/v1/businesses/{business_id}/purchased_items"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/legacy/legacy_v1_businesses.json"
status: verified
savedAt: "2026-01-29T08:10:25.490Z"
verifiedAt: "2026-01-29T08:10:25.490Z"
timesReused: 0
---

# Update Purchased items

## Summary
Endpoint works with directory token and valid types ('staffs', 'sms'). Found several documentation issues including incorrect schema structure, missing auth requirements, and invalid type examples.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_purchased_items
    method: PUT
    path: "/platform/v1/businesses/{{business_id}}/purchased_items"
    body:
      data:
        "0":
          type: staffs
          data:
            bundled: 5
            purchased: 12
        "1":
          type: sms
          data:
            bundled: 3
            purchased: 8
    expect:
      status: [200, 201]
```
