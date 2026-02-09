---
endpoint: "PUT /platform/v1/businesses/{business_uid}/purchased_items"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/legacy/legacy_v1_platform.json"
status: verified
savedAt: "2026-01-28T12:03:46.165Z"
verifiedAt: "2026-01-28T12:03:46.165Z"
timesReused: 0
---

# Update Purchased items

## Summary
Endpoint works correctly with directory/app tokens and valid type values ('staffs' or 'sms'). Staff tokens are not authorized. The original test data used invalid type values.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_purchased_items
    method: PUT
    path: "/platform/v1/businesses/{{business_uid}}/purchased_items"
    body:
      data:
        "0":
          type: sms
          data:
            bundled: 2
            purchased: 7
    expect:
      status: [200, 201]
```
