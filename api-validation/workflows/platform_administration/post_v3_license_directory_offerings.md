---
endpoint: "POST /v3/license/directory_offerings"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/license.json
status: success
savedAt: 2026-01-30T12:00:00.000Z
verifiedAt: 2026-01-30T12:00:00.000Z
---

# Create Directory offerings

## Summary
Creates a DirectoryOffering linking a directory to an offering. Since each directory can only have one DirectoryOffering per `offering_uid` (uniqueness constraint), this workflow **MUST create a fresh offering first** to guarantee no duplication errors.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_directory_offerings
    method: POST
    path: "/v3/license/directory_offerings"
    body:
      type: addon
      SKU: sms
      display_name: test-offering-for-directory-{{timestamp}}
      quantity: 100
      payment_type: monthly
      is_active: true
      vendor: inTandem
      prices:
        "0":
          price: 5
          currency: USD
      trial: 14
      reporting_tags:
        "0": business-management
    expect:
      status: [200, 201]
```
