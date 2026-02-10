---
endpoint: "POST /v3/license/bundled_offerings"
domain: platform_administration
tags: [license, bundled-offerings]
swagger: "swagger/platform_administration/platform_administration.json"
status: verified
savedAt: 2026-02-10T05:17:00.000Z
verifiedAt: 2026-02-10T05:17:00.000Z
timesReused: 0
---

# Create Bundled offerings

## Summary
Creates a bundled offering relationship linking a parent offering with a child offering. When a customer purchases the parent, the bundled child is automatically included. The parent offering must be of type "package" or "app". **Token Type**: Requires an **admin token**.

## Prerequisites

```yaml
steps:
  - id: get_all_offerings
    description: "Fetch all offerings to find suitable parent and child offerings"
    method: GET
    path: "/v3/license/offerings"
    token: admin
    extract:
      # Try different combination - use last app offering and last addon offering
      app_offering_uid: "$.data.offerings[19].uid"   # different app offering as parent
      addon_offering_uid: "$.data.offerings[24].uid"  # last addon offering as child  
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
      offering_uid: "{{app_offering_uid}}"
      bundled_offering_uid: "{{addon_offering_uid}}"
    expect:
      status: [200, 201]
```