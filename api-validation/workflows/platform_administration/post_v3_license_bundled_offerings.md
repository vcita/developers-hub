---
endpoint: "POST /v3/license/bundled_offerings"
domain: platform_administration
tags: [license, bundled-offerings]
swagger: "swagger/platform_administration/platform_administration.json"
status: verified
savedAt: 2026-02-10T19:39:30.000Z
verifiedAt: 2026-02-10T19:39:30.000Z
timesReused: 0
---

# Create Bundled offerings

## Summary
Creates a bundled offering relationship linking a parent offering with a child offering. When a customer purchases the parent, the bundled child is automatically included. The parent offering must be of type "package" or "app". **Token Type**: Requires an **admin token**.

## Prerequisites

```yaml
steps:
  - id: get_all_offerings
    description: "Fetch all offerings to find suitable parent and child offerings. parent is package, addon is addon"
    method: GET
    path: "/v3/license/offerings"
    token: admin
    extract:
      # Use different indices to minimize conflicts
      package_offering_uid: "$.data.offerings[10].uid"
      addon_offering_uid: "$.data.offerings[5].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_bundled_offerings
    method: POST
    path: "/v3/license/bundled_offerings"
    token: admin
    body:
      offering_uid: "{{package_offering_uid}}"
      bundled_offering_uid: "{{addon_offering_uid}}"
    expect:
      status: [200, 201]
```