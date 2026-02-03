---
endpoint: "PUT /platform/v1/businesses/{business_uid}/wizards/{wizard_name}"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/legacy/legacy_v1_platform.json
status: success
savedAt: 2026-01-28T19:11:37.635Z
verifiedAt: 2026-01-28T19:11:37.635Z
---

# Update Wizards

## Summary
Successfully updated wizard using directory token. Initial 401 errors resolved by using correct token type (directory instead of default). Wizard must exist to be updated.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_wizards
    method: PUT
    path: "/platform/v1/businesses/{business_uid}/wizards/{wizard_name}"
    body:
      completed: true
    expect:
      status: [200, 201]
```
