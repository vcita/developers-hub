---
endpoint: "POST /v3/license/bundled_offerings"
domain: platform_administration
tags: [license, bundled-offerings]
swagger: swagger/platform_administration/license.json
status: success
savedAt: 2026-01-31T10:00:00.000Z
verifiedAt: 2026-01-31T10:00:00.000Z
---

# Create Bundled offerings

## Summary
Creates a bundled offering relationship linking a parent offering with a child offering. When a customer purchases the parent, the bundled child is automatically included. Requires **admin/internal token** and valid offering UIDs of correct types.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_bundled_offerings
    method: POST
    path: "/v3/license/bundled_offerings"
    body:
      offering_uid: "{{offering_uid}}"
      bundled_offering_uid: "{{bundled_offering_uid}}"
    expect:
      status: [200, 201]
```
