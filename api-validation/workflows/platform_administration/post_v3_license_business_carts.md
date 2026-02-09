---
endpoint: "POST /v3/license/business_carts"
domain: platform_administration
tags: [license, business-cart]
swagger: "swagger/platform_administration/license.json"
status: verified
savedAt: "2026-01-29T12:00:00.000Z"
verifiedAt: "2026-01-29T12:00:00.000Z"
timesReused: 0
---

# Create Business carts

## Summary
Creates a new BusinessCart for a business. Requires an offering_uid obtained from the Offerings endpoint.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_business_carts
    method: POST
    path: "/v3/license/business_carts"
    body:
      business_cart:
        offering_uid: "{{offering_uid}}"
    expect:
      status: [200, 201]
```
