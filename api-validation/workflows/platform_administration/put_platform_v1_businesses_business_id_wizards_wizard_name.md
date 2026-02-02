---
endpoint: "PUT /platform/v1/businesses/{business_id}/wizards/{wizard_name}"
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-29T08:10:55.188Z
verifiedAt: 2026-01-29T08:10:55.188Z
---

# Update Wizards

## Summary
Test passes with directory token and minimal update body. Original failure was due to empty request body and missing wizard_name parameter.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_wizards
    method: PUT
    path: "/platform/v1/businesses/{business_id}/wizards/{wizard_name}"
    body:
      completed: true
    expect:
      status: [200, 201]
```
