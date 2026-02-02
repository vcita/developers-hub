---
endpoint: "GET /platform/v1/businesses/{business_uid}/wizards/{wizard_name}"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/legacy/legacy_v1_platform.json
status: success
savedAt: 2026-01-28T11:38:44.577Z
verifiedAt: 2026-01-28T11:38:44.577Z
---

# Get Wizards

## Summary
Endpoint works correctly. Returns HTTP 200 with wizard data for valid wizard names and appropriate error message for invalid wizard names. Successfully tested with multiple valid wizard names (os_wizard, payment_wizard).

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_wizards
    method: GET
    path: "/platform/v1/businesses/{business_uid}/wizards/{wizard_name}"
    expect:
      status: [200, 201]
```
